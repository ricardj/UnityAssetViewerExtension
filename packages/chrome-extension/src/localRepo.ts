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

// --- Script GUID Map ---

const GUID_REGEX = /guid:\s*([0-9a-f]{32})/;
const SKIP_DIRS = ['Library', 'Temp', 'Logs', 'Obj', 'UserSettings', 'Packages', 'ProjectSettings', '.git'];

/**
 * Recursively scan the Unity project for .cs.meta files and build a
 * mapping of script GUID → C# class name (derived from the filename).
 */
export async function buildScriptGuidMap(
  dirHandle: FileSystemDirectoryHandle,
  map: Map<string, string> = new Map()
): Promise<Map<string, string>> {
  for await (const entry of (dirHandle as any).values()) {
    if (entry.kind === 'directory') {
      if (SKIP_DIRS.includes(entry.name)) continue;
      await buildScriptGuidMap(entry as FileSystemDirectoryHandle, map);
    } else if (entry.kind === 'file' && entry.name.endsWith('.cs.meta')) {
      try {
        const fileHandle = entry as FileSystemFileHandle;
        const file = await fileHandle.getFile();
        const text = await file.text();
        const match = GUID_REGEX.exec(text);
        if (match) {
          // "MyCustomButton.cs.meta" → "MyCustomButton"
          const className = entry.name.replace('.cs.meta', '');
          map.set(match[1], className);
        }
      } catch (e) {
        // Skip unreadable files silently
      }
    }
  }
  return map;
}

/**
 * Save the script GUID map to IndexedDB for fast subsequent loads.
 */
export async function saveScriptMap(map: Map<string, string>): Promise<void> {
  return new Promise((resolve) => {
    const req = indexedDB.open('UnityViewerDB', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('handles');
    req.onsuccess = () => {
      const db = req.result;
      // Convert Map to a plain object for storage
      const obj = Object.fromEntries(map);
      db.transaction('handles', 'readwrite').objectStore('handles').put(obj, 'scriptGuidMap');
      resolve();
    };
  });
}

/**
 * Load the cached script GUID map from IndexedDB.
 * Returns null if no cached map exists.
 */
export async function loadScriptMap(): Promise<Map<string, string> | null> {
  return new Promise((resolve) => {
    const req = indexedDB.open('UnityViewerDB', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('handles');
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction('handles', 'readonly');
      const getReq = tx.objectStore('handles').get('scriptGuidMap');
      getReq.onsuccess = () => {
        if (getReq.result && typeof getReq.result === 'object') {
          resolve(new Map(Object.entries(getReq.result)));
        } else {
          resolve(null);
        }
      };
    };
  });
}
