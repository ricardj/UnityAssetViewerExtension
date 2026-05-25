import { parseUnityYaml, buildHierarchy, applyModifications } from '@unity-asset-viewer/core-parser';
import { renderHierarchy } from '@unity-asset-viewer/core-renderer';
import { saveHandle, loadHandle, findPrefabByGuid, buildScriptGuidMap, saveScriptMap, loadScriptMap } from './localRepo';

console.log("Unity Asset Viewer content script loaded.");

async function renderPrefab(rawUrl: string, targetContainer: HTMLElement, button: HTMLButtonElement) {
  button.textContent = '⏳ Loading...';
  button.disabled = true;
  
  try {
    const response = await fetch(rawUrl);
    const yamlText = await response.text();
    
    let parsed = parseUnityYaml(yamlText);
    let scriptGuidMap: Map<string, string> | null = null;

    // Try to load a previously-saved directory handle
    let handle = await loadHandle();

    // VARIANT RESOLUTION — requires local repo access
    if (parsed.variantInfo) {
      button.textContent = '📂 Requesting Local Repo Access...';
      
      if (!handle) {
        alert('This is a Prefab Variant! We need to search your local Unity repository to find the base prefab.');
        handle = await (window as any).showDirectoryPicker();
        if (handle) await saveHandle(handle);
      }

      if (handle) {
        // Ensure we have read permissions
        if (await (handle as any).queryPermission({ mode: 'read' }) !== 'granted') {
          await (handle as any).requestPermission({ mode: 'read' });
        }

        button.textContent = '🔍 Searching Local Repo for Base Prefab...';
        const baseYaml = await findPrefabByGuid(handle, parsed.variantInfo.basePrefabGuid);
        if (baseYaml) {
          const baseParsed = parseUnityYaml(baseYaml);
          parsed = applyModifications(baseParsed, parsed);
        } else {
          alert('Could not find the base prefab in the local repository!');
        }
      }
    }

    // SCRIPT NAME RESOLUTION — try to build / load from cache
    if (handle) {
      // Ensure we have read permissions
      if (await (handle as any).queryPermission({ mode: 'read' }) === 'granted') {
        button.textContent = '🔎 Resolving script names...';
        try {
          scriptGuidMap = await buildScriptGuidMap(handle);
          // Cache for next time
          await saveScriptMap(scriptGuidMap);
        } catch (e) {
          console.warn('Failed to scan local repo for script names, using cache', e);
          scriptGuidMap = await loadScriptMap();
        }
      }
    }

    // If no live handle, try the cached map
    if (!scriptGuidMap) {
      scriptGuidMap = await loadScriptMap();
    }
    
    const hierarchy = buildHierarchy(parsed.objects);
    console.log("Hierarchy Output:", hierarchy);
    const renderEl = renderHierarchy(hierarchy, scriptGuidMap ?? undefined);
    
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

function injectPrefabViewers() {
  // 1. PR / MR Pages
  const fileHeaders = document.querySelectorAll('.file-header');
  
  fileHeaders.forEach(header => {
    if (header.hasAttribute('data-unity-viewer-injected')) return;
    
    const titleLink = header.querySelector('a.Link--primary');
    if (!titleLink || !titleLink.textContent?.trim().endsWith('.prefab')) return;
    
    header.setAttribute('data-unity-viewer-injected', 'true');
    
    const button = document.createElement('button');
    button.textContent = '👁️ Render UI Prefab';
    button.className = 'btn btn-sm btn-primary';
    button.style.marginRight = '8px';
    
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      
      const fileContainer = header.closest('.file');
      if (!fileContainer) return;
      
      const links = Array.from(header.querySelectorAll('a[href*="/blob/"]'));
      let rawUrl = '';
      if (links.length > 0) {
         rawUrl = (links[0] as HTMLAnchorElement).href.replace('/blob/', '/raw/');
      } else {
         alert('Could not find the raw file URL in the DOM.');
         return;
      }
      
      const contentDiv = fileContainer.querySelector('.js-file-content');
      if (contentDiv) {
        await renderPrefab(rawUrl, contentDiv as HTMLElement, button);
      }
    });
    
    const fileActions = header.querySelector('.file-actions');
    if (fileActions) {
      fileActions.prepend(button);
    }
  });

  // 2. Single File Blob Pages
  const url = new URL(window.location.href);
  if (url.pathname.includes('/blob/') && url.pathname.endsWith('.prefab')) {
    const rawButton = document.querySelector('[data-testid="raw-button"]') || document.getElementById('raw-url');
    
    if (rawButton && !document.getElementById('unity-viewer-btn-blob')) {
      const button = document.createElement('button');
      button.id = 'unity-viewer-btn-blob';
      button.textContent = '👁️ Render UI Prefab';
      // GitHub new UI button classes for consistency, or fallback to generic btn
      button.className = rawButton.className.includes('btn') ? 'btn btn-sm btn-primary' : 'types__StyledButton-sc-ws60qy-0 dLQcn types__BaseButton-sc-1lxyrv6-0 gnYqjI'; 
      button.style.marginRight = '8px';
      
      button.addEventListener('click', async (e) => {
        e.preventDefault();
        
        let rawUrl = (rawButton as HTMLAnchorElement).href;
        if (!rawUrl) rawUrl = window.location.href.replace('/blob/', '/raw/');
        
        // Find container to render into
        const codeViewContainer = document.querySelector('.react-code-view-bottom') || 
                                  document.querySelector('.blob-wrapper') || 
                                  document.querySelector('[data-testid="read-only-cursor-text-area"]')?.parentElement?.parentElement ||
                                  document.querySelector('.js-file-content');
                                  
        if (codeViewContainer) {
          await renderPrefab(rawUrl, codeViewContainer as HTMLElement, button);
        } else {
          // Fallback container
          const fallback = document.createElement('div');
          fallback.style.padding = '16px';
          rawButton.closest('div')?.parentElement?.parentElement?.appendChild(fallback);
          await renderPrefab(rawUrl, fallback, button);
        }
      });
      
      // Inject before the raw button
      if (rawButton.parentElement) {
        rawButton.parentElement.style.display = 'flex';
        rawButton.parentElement.style.alignItems = 'center';
        rawButton.parentElement.insertBefore(button, rawButton);
      }
    }
  }
}

setInterval(injectPrefabViewers, 1500);
