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
