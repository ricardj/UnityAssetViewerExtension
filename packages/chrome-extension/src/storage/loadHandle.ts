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
