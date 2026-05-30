import { UnityPrefabCompleteParser, UnityPrefabHierarchyBuilder } from '@unity-asset-viewer/core-parser';
import { UnityHierarchyRenderer } from '@unity-asset-viewer/core-renderer';
import { WebviewLocalRepoProvider } from './webview-host/WebviewLocalRepoProvider';

export class WebviewBootstrap {
  public static bootstrap(): void {
    const repoProvider = new WebviewLocalRepoProvider();

    window.addEventListener('message', async event => {
      const message = event.data;
      
      if (message.command === 'parse') {
        try {
          const root = document.getElementById('root');
          if (root) {
            root.innerHTML = '<div style="padding: 20px; font-family: sans-serif; color: #fff;">🔍 Loading prefab and resolving dependencies...</div>';
            
            // Parse the prefab yaml text using unified Complete parser
            const parsed = await UnityPrefabCompleteParser.parse(message.text, repoProvider);
            
            // Resolve script mappings
            let scriptGuidMap: Map<string, string> | null = null;
            try {
              scriptGuidMap = await repoProvider.getScriptGuidMap();
            } catch (e) {
              console.warn('Failed to scan script guidance map', e);
            }

            // Resolve image assets asynchronously in background
            const globalGuidMap = new Map<string, string>();
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

            const nodes = UnityPrefabHierarchyBuilder.build(parsed.objects);
            
            // Render the nodes
            const element = UnityHierarchyRenderer.render(nodes, scriptGuidMap ?? undefined, globalGuidMap);
            
            root.innerHTML = ''; // Clear loading screen
            // Append to our root div
            root.appendChild(element);
          }
        } catch (error: any) {
          console.error('Failed to parse or render prefab:', error);
          const root = document.getElementById('root');
          if (root) {
            root.innerHTML = `<div style="color: #ff6b6b; padding: 20px; font-family: sans-serif;">Failed to render prefab: ${error.message}</div>`;
          }
        }
      }
    });
  }
}

WebviewBootstrap.bootstrap();
