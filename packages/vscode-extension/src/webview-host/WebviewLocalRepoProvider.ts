import { ILocalRepoProvider } from '@unity-asset-viewer/core-parser';

declare function acquireVsCodeApi(): any;

export class WebviewLocalRepoProvider implements ILocalRepoProvider {
  private messageIdCounter = 0;
  private pendingRequests = new Map<number, { resolve: (val: any) => void; reject: (err: any) => void }>();
  private vscode: any;

  constructor() {
    this.vscode = acquireVsCodeApi();
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
      this.vscode.postMessage({ command: 'repoRequest', id, type, payload });
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
