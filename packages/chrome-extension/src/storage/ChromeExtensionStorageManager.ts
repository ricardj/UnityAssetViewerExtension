export class ChromeExtensionStorageManager {
  public static async saveDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<boolean> {
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

  public static async loadDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
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

  /**
   * Save the script GUID map to IndexedDB for fast subsequent loads.
   */
  public static async saveScriptGuidMap(map: Map<string, string>): Promise<void> {
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
  public static async loadScriptGuidMap(): Promise<Map<string, string> | null> {
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
}
