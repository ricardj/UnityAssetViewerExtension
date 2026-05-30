import { LocalRepoProvider } from '@unity-asset-viewer/core-parser';
import { findPrefabByGuid } from './findPrefabByGuid';
import { buildScriptGuidMap } from './buildScriptGuidMap';
import { findAssetFileByGuid } from './findAssetFileByGuid';

export class ChromeLocalRepoProvider implements LocalRepoProvider {
  constructor(private dirHandle: FileSystemDirectoryHandle) {}

  async findPrefabByGuid(guid: string): Promise<string | null> {
    return findPrefabByGuid(this.dirHandle, guid);
  }

  async getScriptGuidMap(): Promise<Map<string, string>> {
    return buildScriptGuidMap(this.dirHandle);
  }

  async resolveAssetUrl(guid: string): Promise<string | null> {
    const file = await findAssetFileByGuid(this.dirHandle, guid);
    if (file) {
      return URL.createObjectURL(file);
    }
    return null;
  }
}
