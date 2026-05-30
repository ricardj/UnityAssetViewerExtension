import { LocalRepoProvider } from '@unity-asset-viewer/core-parser';

export function getViteFsUrl(absolutePath: string): string {
  const normalized = absolutePath.replace(/\\/g, '/');
  return normalized.startsWith('/') ? `/@fs${normalized}` : `/@fs/${normalized}`;
}

export class DevLocalRepoProvider implements LocalRepoProvider {
  constructor(private guidMap: Record<string, string>) {}

  async findPrefabByGuid(guid: string): Promise<string | null> {
    const path = this.guidMap[guid];
    if (!path) return null;
    const res = await fetch(getViteFsUrl(path));
    return res.ok ? res.text() : null;
  }

  async getScriptGuidMap(): Promise<Map<string, string>> {
    return new Map(Object.entries(this.guidMap));
  }

  async resolveAssetUrl(guid: string): Promise<string | null> {
    const path = this.guidMap[guid];
    return path ? getViteFsUrl(path) : null;
  }
}
