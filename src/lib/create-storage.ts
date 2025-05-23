import { openDB } from "idb";
import { load } from "@tauri-apps/plugin-store";
import { isTauri } from "./device";

import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from "@capacitor-community/sqlite";
import { Capacitor } from "@capacitor/core";

const DB_VERSION = 1;
const DB_NAME = "lemmy-db";
const TABLE_NAME = "lemmy-store";

let db: Promise<SQLiteDBConnection> | null = null;

function createSqliteStore(rowName?: string) {
  if (!db) {
    const sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
    db = (async function () {
      try {
        await sqlite.closeConnection(DB_NAME, false);
      } catch {}
      const p = await sqlite.createConnection(
        DB_NAME,
        false,
        "",
        DB_VERSION,
        false,
      );
      return p;
    })();
  }

  // Lazily create/open the connection and ensure the table exists.
  async function getDb(): Promise<SQLiteDBConnection> {
    const dbAwaited = await db!;

    const isOpen = await dbAwaited.isDBOpen();
    if (isOpen.result) {
      return dbAwaited;
    }

    await dbAwaited.open();
    await dbAwaited.run(
      `CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT)`,
      [],
    );

    return dbAwaited;
  }

  return {
    async getItem(key: string): Promise<string | null> {
      const connection = await getDb();
      const fullKey = `${rowName}_${key}`;
      // Use query with value interpolation for SELECT
      const res = await connection.query(`SELECT value FROM kv WHERE key = ?`, [
        fullKey,
      ]);
      if (res.values && res.values.length > 0) {
        return res.values[0].value;
      }
      return null;
    },

    async setItem(key: string, value: string): Promise<void> {
      const connection = await getDb();
      const fullKey = `${rowName}_${key}`;
      // Use run with value interpolation for INSERT OR REPLACE
      await connection.run(
        `INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)`,
        [fullKey, value],
      );
    },

    async removeItem(key: string): Promise<void> {
      const connection = await getDb();
      const fullKey = `${rowName}_${key}`;
      // Use run with value interpolation for DELETE
      await connection.run(`DELETE FROM kv WHERE key = ?`, [fullKey]);
    },

    async getDbSize() {
      const connection = await getDb();

      // Retrieve both key and value from the kv table
      const res = await connection.query(`SELECT key, value FROM kv`, []);

      let totalSize = 0;
      const sizes: [string, number][] = [];
      if (res.values) {
        for (const row of res.values) {
          if (row.value) {
            const size = new Blob([JSON.stringify(row.value)]).size;
            totalSize += size;
            // Estimate size in bytes using a Blob of the JSON-stringified value.
            sizes.push([row.key, size]);
          }
        }
      }
      return sizes
        .filter(([_, size]) => {
          return size / totalSize > 0.01;
        })
        .sort(([_aKey, aSize], [_bKey, bSize]) => {
          return bSize - aSize;
        });
    },
  };
}

function createTauriStore(rowName: string) {
  const store = load(DB_NAME, { autoSave: 5 * 1000 });

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

function createIdb(rowName: string) {
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
  if (Capacitor.isNativePlatform()) {
    return createSqliteStore(rowName);
  } else if (isTauri()) {
    return createTauriStore(rowName);
  } else {
    return createIdb(rowName);
  }
}

export async function getDbSizes() {
  const sizes: [string, number][] = [];
  let totalSize = 0;

  if (Capacitor.isNativePlatform()) {
    const db = createSqliteStore();
    return db.getDbSize();
  } else if (isTauri()) {
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
    .sort(([_aKey, aSize], [_bKey, bSize]) => {
      return bSize - aSize;
    });
}
