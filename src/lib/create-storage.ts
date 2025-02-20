import { openDB } from "idb";
import { load } from "@tauri-apps/plugin-store";
import { isTauri } from "./tauri";

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
  };
}

export function createDb(rowName: string) {
  if (isTauri()) {
    return createTauriStore(rowName);
  } else {
    return createIdb(rowName);
  }
}
