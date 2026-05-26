import { parseUnityYaml, buildHierarchy, applyModifications } from '@unity-asset-viewer/core-parser';
import { renderHierarchy } from './index';

import samplePrefab from '../../core-parser/tests/sample.prefab?raw';

interface PreviewMeta {
  filename: string;
  originalPath: string;
  timestamp: string;
  unityProjectRoot?: string;
}

function getViteFsUrl(absolutePath: string): string {
  const normalized = absolutePath.replace(/\\/g, '/');
  return normalized.startsWith('/') ? `/@fs${normalized}` : `/@fs/${normalized}`;
}

async function init() {
  let prefabText = samplePrefab;
  let filename = 'sample.prefab';
  let isDefault = true;
  let prefabFolder = '/tmp'
  let guidMap: Record<string, string> = {};

  try {
    // 1. Attempt to fetch preview metadata
    const metaRes = await fetch(prefabFolder + '/preview-meta.json');
    if (metaRes.ok) {
      const meta: PreviewMeta = await metaRes.json();
      filename = meta.filename;
      
      // 2. Attempt to fetch the actual prefab target
      const prefabRes = await fetch(prefabFolder + '/preview-target.prefab');
      if (prefabRes.ok) {
        prefabText = await prefabRes.text();
        isDefault = false;
      }

      // 3. Fetch guid-map if available
      try {
        const guidMapRes = await fetch(prefabFolder + '/guid-map.json');
        if (guidMapRes.ok) {
          guidMap = await guidMapRes.json();
        }
      } catch (err) {
        console.warn('Could not load guid-map.json', err);
      }
    }
  } catch (err) {
    console.warn('Could not load custom preview. Falling back to default sample.', err);
  }

  // Update visual status indicators in index.html
  const statusEl = document.getElementById('preview-status');
  const detailsEl = document.getElementById('preview-details');

  if (statusEl) {
    if (isDefault) {
      statusEl.textContent = 'Viewing Default Sample';
      statusEl.className = 'status-badge default-mode';
    } else {
      statusEl.textContent = `Live Previewing`;
      statusEl.className = 'status-badge preview-mode';
    }
  }

  if (detailsEl) {
    detailsEl.textContent = filename;
  }

  // Parse and Render
  try {
    let parsed = parseUnityYaml(prefabText);

    if (parsed.variantInfo) {
      const baseGuid = parsed.variantInfo.basePrefabGuid;
      const basePath = guidMap[baseGuid];
      if (basePath) {
        try {
          const baseRes = await fetch(getViteFsUrl(basePath));
          if (baseRes.ok) {
            const baseText = await baseRes.text();
            const baseParsed = parseUnityYaml(baseText);
            parsed = applyModifications(baseParsed, parsed);
          }
        } catch (err) {
           console.error("Failed to load base prefab from Vite server", err);
        }
      } else {
        console.warn("Base prefab GUID not found in guid-map.json", baseGuid);
      }
    }

    console.log('Parsed Objects:', parsed.objects);
    
    const hierarchy = buildHierarchy(parsed.objects);
    console.log('Hierarchy:', hierarchy);
    
    // Convert guidMap object to Map
    const globalGuidMap = new Map(Object.entries(guidMap));

    // For script mapping, we can just use the same global map in the dev environment.
    const rootEl = renderHierarchy(hierarchy, globalGuidMap, globalGuidMap);
    
    const appEl = document.getElementById('app')!;
    appEl.innerHTML = ''; // Clear loading state
    appEl.appendChild(rootEl);
  } catch (error: any) {
    console.error('Render failed:', error);
    const appEl = document.getElementById('app')!;
    appEl.innerHTML = `
      <div style="color: #ff6b6b; padding: 40px; font-family: sans-serif; text-align: center;">
        <h3 style="margin-top: 0;">❌ Parsing/Rendering Error</h3>
        <p style="color: #ccc; font-size: 14px;">${error.message || error}</p>
      </div>
    `;
  }
}

init();
