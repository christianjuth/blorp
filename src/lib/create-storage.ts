import { openDB } from "idb";
import { load } from "@tauri-apps/plugin-store";
import { isTauri } from "./tauri";
import { size } from "lodash";

const DB_VERSION = 1;
const DB_NAME = "lemmy-db";
const TABLE_NAME = "lemmy-store";

export function createTauriStore(rowName: string) {
  const store = load(DB_NAME, { autoSave: true });

  return {
    async getItem(key: string): Promise<string | null> {
      const db = await store;
      return (await db.get(`${rowName}_${key}`)) ?? null;
    },

    async setItem(key: string, value: string): Promise<void> {
      const db = await store;
      await db.set(`${rowName}_${key}`, value);
    },

    async removeItem(key: string): Promise<void> {
      const db = await store;
      await db.delete(`${rowName}_${key}`);
    },

    async getRowSize(): Promise<number> {
      const db = await store;

      const keys = await db.keys();

      let totalSize = 0;

      for (const key of keys) {
        if (typeof key === "string" && key.startsWith(`${rowName}_`)) {
          const value = await db.get(key);
          if (value) {
            const size = new Blob([JSON.stringify(value)]).size; // Estimate size in bytes
            totalSize += size;
          }
        }
      }

      return totalSize; // Size in bytes
    },
  };
}

export function createIdb(rowName: string) {
  function getDb() {
    return openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Check if the store exists, and create it if not
        if (!db.objectStoreNames.contains(TABLE_NAME)) {
          db.createObjectStore(TABLE_NAME);
        }
      },
    });
  }

  return {
    async getItem(key: string): Promise<string | null> {
      const db = await getDb();
      return await db.get(TABLE_NAME, `${rowName}_${key}`);
    },

    async setItem(key: string, value: string): Promise<void> {
      const db = await getDb();
      await db.put(TABLE_NAME, value, `${rowName}_${key}`);
    },

    async removeItem(key: string): Promise<void> {
      const db = await getDb();
      await db.delete(TABLE_NAME, `${rowName}_${key}`);
    },

    async getRowSize(): Promise<number> {
      const db = await getDb();
      const tx = db.transaction(TABLE_NAME, "readonly");
      const store = tx.objectStore(TABLE_NAME);
      const keys = await store.getAllKeys(); // Get all keys

      let totalSize = 0;

      for (const key of keys) {
        if (typeof key === "string" && key.startsWith(`${rowName}_`)) {
          const value = await store.get(key);
          if (value) {
            const size = new Blob([JSON.stringify(value)]).size; // Estimate size in bytes
            totalSize += size;
          }
        }
      }

      return totalSize; // Size in bytes
    },
  };
}

export function createDb(rowName: string) {
  if (isTauri()) {
    return createTauriStore(rowName);
  } else {
    return createIdb(rowName);
  }
}

export async function getDbSizes() {
  const sizes: [string, number][] = [];
  let totalSize = 0;

  if (isTauri()) {
    const store = await load(DB_NAME, { autoSave: false });
    const keys = await store.keys();

    for (const key of keys) {
      const value = await store.get(key);
      const size = new Blob([JSON.stringify(value)]).size; // Estimate size in bytes
      totalSize += size;
      sizes.push([key.toString(), size]);
    }
  } else {
    const db = await openDB(DB_NAME, DB_VERSION);
    const keys = await db.getAllKeys(TABLE_NAME);

    for (const key of keys) {
      const value = await db.get(TABLE_NAME, key);
      const size = new Blob([JSON.stringify(value)]).size; // Estimate size in bytes
      totalSize += size;
      sizes.push([key.toString(), size]);
    }
  }

  return sizes
    .filter(([_, size]) => {
      return size / totalSize > 0.01;
    })
    .sort(([aKey, aSize], [bKey, bSize]) => {
      return bSize - aSize;
    });
}
