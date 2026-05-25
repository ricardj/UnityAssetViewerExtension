import { parseUnityYaml, buildHierarchy } from '@unity-asset-viewer/core-parser';
import { renderHierarchy } from './index';

import samplePrefab from '../../core-parser/tests/sample.prefab?raw';

interface PreviewMeta {
  filename: string;
  originalPath: string;
  timestamp: string;
}

async function init() {
  let prefabText = samplePrefab;
  let filename = 'sample.prefab';
  let isDefault = true;
  let prefabFolder = '/tmp'

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
    const parsed = parseUnityYaml(prefabText);
    console.log('Parsed Objects:', parsed.objects);
    
    const hierarchy = buildHierarchy(parsed.objects);
    console.log('Hierarchy:', hierarchy);
    
    const rootEl = renderHierarchy(hierarchy);
    
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
