// Support resolving binary asset files for createObjectURL
export async function findAssetFileByGuid(dirHandle: FileSystemDirectoryHandle, guid: string): Promise<File | null> {
  for await (const entry of (dirHandle as any).values()) {
    if (entry.kind === 'directory') {
      if (['Library', 'Temp', 'Logs', 'Obj', 'UserSettings', 'Packages', 'ProjectSettings', '.git'].includes(entry.name)) continue;
      
      const result = await findAssetFileByGuid(entry as FileSystemDirectoryHandle, guid);
      if (result) return result;
    } else if (entry.kind === 'file' && entry.name.endsWith('.meta')) {
      const fileHandle = entry as FileSystemFileHandle;
      const file = await fileHandle.getFile();
      const text = await file.text();
      
      if (text.includes(`guid: ${guid}`)) {
        const assetName = entry.name.replace('.meta', '');
        try {
          const assetHandle = await dirHandle.getFileHandle(assetName);
          return await assetHandle.getFile();
        } catch (e) {
          console.error("Found meta but failed to load corresponding asset", e);
        }
      }
    }
  }
  return null;
}
