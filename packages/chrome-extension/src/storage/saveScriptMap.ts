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
