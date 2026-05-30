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
