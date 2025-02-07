import { openDB } from "idb";

const DB_VERSION = 1;

export function createDb(rowName: string) {
  const dbName = "lemmy-db";
  const storeName = "lemmy-store";

  function getDb() {
    return openDB(dbName, DB_VERSION, {
      upgrade(db) {
        // Check if the store exists, and create it if not
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      },
    });
  }

  return {
    async getItem(key: string): Promise<string | null> {
      const db = await getDb();
      return await db.get(storeName, `${rowName}_${key}`);
    },

    async setItem(key: string, value: string): Promise<void> {
      const db = await getDb();
      await db.put(storeName, value, `${rowName}_${key}`);
    },

    async removeItem(key: string): Promise<void> {
      const db = await getDb();
      await db.delete(storeName, `${rowName}_${key}`);
    },
  };
}
