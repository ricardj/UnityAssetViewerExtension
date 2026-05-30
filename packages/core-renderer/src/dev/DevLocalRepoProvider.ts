import { ILocalRepoProvider } from '@unity-asset-viewer/core-parser';
import { UnityVitePathResolver } from './UnityVitePathResolver';

export class DevLocalRepoProvider implements ILocalRepoProvider {
  constructor(private guidMap: Record<string, string>) {}

  async findPrefabByGuid(guid: string): Promise<string | null> {
    const path = this.guidMap[guid];
    if (!path) return null;
    const res = await fetch(UnityVitePathResolver.getViteFsUrl(path));
    return res.ok ? res.text() : null;
  }

  async getScriptGuidMap(): Promise<Map<string, string>> {
    return new Map(Object.entries(this.guidMap));
  }

  async resolveAssetUrl(guid: string): Promise<string | null> {
    const path = this.guidMap[guid];
    return path ? UnityVitePathResolver.getViteFsUrl(path) : null;
  }
}
