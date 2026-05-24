import { parseUnityYaml, buildHierarchy, applyModifications } from '@unity-asset-viewer/core-parser';
import { renderHierarchy } from '@unity-asset-viewer/core-renderer';
import { saveHandle, loadHandle, findPrefabByGuid } from './localRepo';

console.log("Unity Asset Viewer content script loaded.");

function injectPrefabViewers() {
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
      
      button.textContent = '⏳ Loading...';
      button.disabled = true;
      
      try {
        const response = await fetch(rawUrl);
        const yamlText = await response.text();
        
        let parsed = parseUnityYaml(yamlText);

        // VARIANT RESOLUTION
        if (parsed.variantInfo) {
          button.textContent = '📂 Requesting Local Repo Access...';
          
          let handle = await loadHandle();
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
        
        const hierarchy = buildHierarchy(parsed.objects);
        const renderEl = renderHierarchy(hierarchy);
        
        renderEl.style.minHeight = '600px';
        renderEl.style.borderTop = '1px solid #30363d';
        
        const contentDiv = fileContainer.querySelector('.js-file-content');
        if (contentDiv) {
          contentDiv.innerHTML = ''; 
          contentDiv.appendChild(renderEl);
        }
        
        button.textContent = '✅ Rendered';
      } catch (err) {
        console.error(err);
        button.textContent = '❌ Error';
        button.disabled = false;
      }
    });
    
    const fileActions = header.querySelector('.file-actions');
    if (fileActions) {
      fileActions.prepend(button);
    }
  });
}

setInterval(injectPrefabViewers, 1500);
