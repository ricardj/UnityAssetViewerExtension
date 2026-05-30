import { ILocalRepoProvider } from '@unity-asset-viewer/core-parser';
import { UnityPrefabFileResolver } from './UnityPrefabFileResolver';
import { UnityScriptGuidMapBuilder } from './UnityScriptGuidMapBuilder';
import { UnityAssetFileResolver } from './UnityAssetFileResolver';

export class ChromeLocalRepoProvider implements ILocalRepoProvider {
  constructor(private dirHandle: FileSystemDirectoryHandle) {}

  async findPrefabByGuid(guid: string): Promise<string | null> {
    return UnityPrefabFileResolver.resolve(this.dirHandle, guid);
  }

  async getScriptGuidMap(): Promise<Map<string, string>> {
    return UnityScriptGuidMapBuilder.build(this.dirHandle);
  }

  async resolveAssetUrl(guid: string): Promise<string | null> {
    const file = await UnityAssetFileResolver.resolve(this.dirHandle, guid);
    if (file) {
      return URL.createObjectURL(file);
    }
    return null;
  }
}
