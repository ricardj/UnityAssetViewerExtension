import { UnityPrefabCompleteParser, UnityPrefabHierarchyBuilder } from '@unity-asset-viewer/core-parser';
import { UnityHierarchyRenderer } from '../index';
import { IPreviewMeta } from './IPreviewMeta';
import { DevLocalRepoProvider } from './DevLocalRepoProvider';
import { UnityVitePathResolver } from './UnityVitePathResolver';

import samplePrefab from '../../../core-parser/tests/sample.prefab?raw';

export class DevServerBootstrap {
  public static async initialize(): Promise<void> {
    let prefabText = samplePrefab;
    let filename = 'sample.prefab';
    let isDefault = true;
    let prefabFolder = '/tmp';
    let guidMap: Record<string, string> = {};

    try {
      // 1. Attempt to fetch preview metadata
      const metaRes = await fetch(prefabFolder + '/preview-meta.json');
      if (metaRes.ok) {
        const meta: IPreviewMeta = await metaRes.json();
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
      const repoProvider = new DevLocalRepoProvider(guidMap);
      const parsed = await UnityPrefabCompleteParser.parse(prefabText, repoProvider);

      console.log('Parsed Objects:', parsed.objects);
      
      const hierarchy = UnityPrefabHierarchyBuilder.build(parsed.objects);
      console.log('Hierarchy:', hierarchy);
      
      // Resolve visual image assets and script mapping
      const globalGuidMap = new Map<string, string>();
      const scriptGuidMap = new Map<string, string>();

      for (const guid in guidMap) {
        const p = guidMap[guid];
        if (p.endsWith('.cs') || p.endsWith('.cs.meta')) {
          const className = p.split(/[\\/]/).pop()?.replace('.meta', '').replace('.cs', '') || '';
          scriptGuidMap.set(guid, className);
        } else {
          globalGuidMap.set(guid, UnityVitePathResolver.getViteFsUrl(p));
        }
      }

      console.log(`GUID maps populated: visual assets: ${globalGuidMap.size}, scripts: ${scriptGuidMap.size}`);

      // Debug: log all Image component sprite GUIDs to verify they exist in the map
      for (const obj of parsed.objects) {
        if (obj.properties.m_Sprite?.guid) {
          const guid = obj.properties.m_Sprite.guid;
          const resolved = globalGuidMap.get(guid);
          console.log(`Sprite GUID ${guid} → ${resolved ? resolved : '❌ NOT FOUND in guid-map'}`);
        }
      }

      const rootEl = UnityHierarchyRenderer.render(hierarchy, scriptGuidMap, globalGuidMap);
      
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
}

// Automatically initialize when loaded
DevServerBootstrap.initialize();
