export async function findPrefabByGuid(dirHandle: FileSystemDirectoryHandle, guid: string): Promise<string | null> {
  for await (const entry of (dirHandle as any).values()) {
    if (entry.kind === 'directory') {
      if (['Library', 'Temp', 'Logs', 'Obj', 'UserSettings', 'Packages', 'ProjectSettings'].includes(entry.name)) continue;
      
      const result = await findPrefabByGuid(entry as FileSystemDirectoryHandle, guid);
      if (result) return result;
    } else if (entry.kind === 'file' && entry.name.endsWith('.meta')) {
      const fileHandle = entry as FileSystemFileHandle;
      const file = await fileHandle.getFile();
      const text = await file.text();
      
      if (text.includes(`guid: ${guid}`)) {
        const prefabName = entry.name.replace('.meta', '');
        try {
          const prefabHandle = await dirHandle.getFileHandle(prefabName);
          const prefabFile = await prefabHandle.getFile();
          return await prefabFile.text();
        } catch (e) {
          console.error("Found meta but failed to load corresponding prefab", e);
        }
      }
    }
  }
  return null;
}
