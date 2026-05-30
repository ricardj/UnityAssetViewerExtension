import { parsePrefabComplete, buildHierarchy, LocalRepoProvider } from '@unity-asset-viewer/core-parser';
import { renderHierarchy } from '@unity-asset-viewer/core-renderer';

// Declare acquireVsCodeApi so TypeScript doesn't complain
declare function acquireVsCodeApi(): any;
const vscode = acquireVsCodeApi();

class WebviewLocalRepoProvider implements LocalRepoProvider {
  private messageIdCounter = 0;
  private pendingRequests = new Map<number, { resolve: (val: any) => void; reject: (err: any) => void }>();

  constructor() {
    window.addEventListener('message', event => {
      const message = event.data;
      if (message.command === 'repoResponse') {
        const req = this.pendingRequests.get(message.id);
        if (req) {
          if (message.error) {
            req.reject(new Error(message.error));
          } else {
            req.resolve(message.result);
          }
          this.pendingRequests.delete(message.id);
        }
      }
    });
  }

  private sendRequest(type: string, payload: any): Promise<any> {
    const id = ++this.messageIdCounter;
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      vscode.postMessage({ command: 'repoRequest', id, type, payload });
    });
  }

  async findPrefabByGuid(guid: string): Promise<string | null> {
    return this.sendRequest('findPrefabByGuid', { guid });
  }

  async getScriptGuidMap(): Promise<Map<string, string>> {
    const obj = await this.sendRequest('getScriptGuidMap', {});
    return new Map(Object.entries(obj || {}));
  }

  async resolveAssetUrl(guid: string): Promise<string | null> {
    return this.sendRequest('resolveAssetUrl', { guid });
  }
}

const repoProvider = new WebviewLocalRepoProvider();

window.addEventListener('message', async event => {
  const message = event.data;
  
  if (message.command === 'parse') {
    try {
      const root = document.getElementById('root');
      if (root) {
        root.innerHTML = '<div style="padding: 20px; font-family: sans-serif; color: #fff;">🔍 Loading prefab and resolving dependencies...</div>';
        
        // Parse the prefab yaml text using unified Complete parser
        const parsed = await parsePrefabComplete(message.text, repoProvider);
        
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

        const nodes = buildHierarchy(parsed.objects);
        
        // Render the nodes
        const element = renderHierarchy(nodes, scriptGuidMap ?? undefined, globalGuidMap);
        
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

