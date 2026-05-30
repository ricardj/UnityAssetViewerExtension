import { UnityPrefabCompleteParser, UnityPrefabHierarchyBuilder, UnityYamlParser } from '@unity-asset-viewer/core-parser';
import { UnityHierarchyRenderer } from '@unity-asset-viewer/core-renderer';
import { ChromeLocalRepoProvider } from './repo/ChromeLocalRepoProvider';
import { ChromeExtensionStorageManager } from './storage/ChromeExtensionStorageManager';
import { GitHubProvider } from './providers/GitHubProvider';
import { GitLabProvider } from './providers/GitLabProvider';
import { BitbucketProvider } from './providers/BitbucketProvider';
import { IGitProvider } from './providers/IGitProvider';

export class ChromeExtensionContentCoordinator {
  private static providers: IGitProvider[] = [
    new GitHubProvider(),
    new GitLabProvider(),
    new BitbucketProvider()
  ];

  public static bootstrap(): void {
    console.log("Unity Asset Viewer content script loaded.");
    setInterval(() => this.injectPrefabViewers(), 1500);
  }

  private static async renderPrefab(rawUrl: string, targetContainer: HTMLElement, button: HTMLButtonElement) {
    button.textContent = '⏳ Loading...';
    button.disabled = true;
    
    try {
      const response = await fetch(rawUrl);
      const yamlText = await response.text();
      
      let scriptGuidMap: Map<string, string> | null = null;

      // Try to load a previously-saved directory handle
      let handle = await ChromeExtensionStorageManager.loadDirectoryHandle();

      // Check if we need local repo access (if it's a variant)
      const initialParsed = UnityYamlParser.parse(yamlText);
      if (initialParsed.variantInfo && !handle) {
        button.textContent = '📂 Requesting Local Repo Access...';
        alert('This is a Prefab Variant! We need to search your local Unity repository to find the base prefab.');
        handle = await (window as any).showDirectoryPicker();
        if (handle) {
          await ChromeExtensionStorageManager.saveDirectoryHandle(handle);
        }
      }

      let repoProvider: ChromeLocalRepoProvider | undefined = undefined;
      if (handle) {
        // Ensure we have read permissions
        if (await (handle as any).queryPermission({ mode: 'read' }) !== 'granted') {
          await (handle as any).requestPermission({ mode: 'read' });
        }
        repoProvider = new ChromeLocalRepoProvider(handle);
      }

      button.textContent = '🔍 Loading Prefab and dependencies...';
      const parsed = await UnityPrefabCompleteParser.parse(yamlText, repoProvider);

      // SCRIPT NAME RESOLUTION — try to build / load from cache
      if (repoProvider) {
        button.textContent = '🔎 Resolving script names...';
        try {
          scriptGuidMap = await repoProvider.getScriptGuidMap();
          // Cache for next time
          await ChromeExtensionStorageManager.saveScriptGuidMap(scriptGuidMap);
        } catch (e) {
          console.warn('Failed to scan local repo for script names, using cache', e);
          scriptGuidMap = await ChromeExtensionStorageManager.loadScriptGuidMap();
        }
      }

      // If no live handle/map, try the cached map
      if (!scriptGuidMap) {
        scriptGuidMap = await ChromeExtensionStorageManager.loadScriptGuidMap();
      }

      // ASSET RESOLUTION — Resolve sprite/asset URLs
      const globalGuidMap = new Map<string, string>();
      if (repoProvider) {
        button.textContent = '🖼️ Resolving visual assets...';
        const spriteGuids = new Set<string>();
        for (const obj of parsed.objects) {
          if (obj.properties) {
            const spriteGuid = obj.properties.m_Sprite?.guid;
            if (spriteGuid) {
              spriteGuids.add(spriteGuid);
            }
          }
        }
        for (const guid of spriteGuids) {
          try {
            const url = await repoProvider.resolveAssetUrl(guid);
            if (url) {
              globalGuidMap.set(guid, url);
            }
          } catch (e) {
            console.warn(`Failed to resolve asset URL for GUID ${guid}:`, e);
          }
        }
      }
      
      const hierarchy = UnityPrefabHierarchyBuilder.build(parsed.objects);
      console.log("Hierarchy Output:", hierarchy);
      const renderEl = UnityHierarchyRenderer.render(hierarchy, scriptGuidMap ?? undefined, globalGuidMap);
      
      renderEl.style.minHeight = '600px';
      
      targetContainer.innerHTML = ''; 
      targetContainer.appendChild(renderEl);
      
      button.textContent = '✅ Rendered';
    } catch (err) {
      console.error(err);
      button.textContent = '❌ Error';
      button.disabled = false;
    }
  }

  private static injectPrefabViewers() {
    for (const provider of this.providers) {
      provider.inject(this.renderPrefab.bind(this));
    }
  }
}

ChromeExtensionContentCoordinator.bootstrap();
