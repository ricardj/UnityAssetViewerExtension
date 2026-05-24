export async function saveHandle(handle: FileSystemDirectoryHandle) {
  return new Promise((resolve) => {
    const req = indexedDB.open('UnityViewerDB', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('handles');
    req.onsuccess = () => {
      const db = req.result;
      db.transaction('handles', 'readwrite').objectStore('handles').put(handle, 'repoDir');
      resolve(true);
    };
  });
}

export async function loadHandle(): Promise<FileSystemDirectoryHandle | null> {
  return new Promise((resolve) => {
    const req = indexedDB.open('UnityViewerDB', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('handles');
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction('handles', 'readonly');
      const getReq = tx.objectStore('handles').get('repoDir');
      getReq.onsuccess = () => resolve(getReq.result || null);
    };
  });
}

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
