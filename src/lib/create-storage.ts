export function createDb(rowName: string) {
  const dbName = "lemmy-db";
  const storeName = "lemmy-store";

  async function getDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  return {
    async getItem(key: string): Promise<string | null> {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, "readonly");
        const store = transaction.objectStore(storeName);
        const request = store.get(`${rowName}_${key}`);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    },

    async setItem(key: string, value: string): Promise<void> {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.put(value, `${rowName}_${key}`);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    },

    async removeItem(key: string): Promise<void> {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.delete(`${rowName}_${key}`);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    },
  };
}
