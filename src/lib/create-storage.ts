import { openDB } from "idb";
import { load } from "@tauri-apps/plugin-store";
import { isTauri } from "./device";
import _ from "lodash";
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from "@capacitor-community/sqlite";
import { Capacitor } from "@capacitor/core";
import { debounceByKey } from "./debounce-by-key";
import pRetry from "p-retry";

const DB_VERSION = 1;
const DB_NAME = "lemmy-db";
const TABLE_NAME = "lemmy-store";

let db: Promise<SQLiteDBConnection> | null = null;

function generateSqlcipherSecret(byteLen = 32): string {
  const bytes = new Uint8Array(byteLen);
  crypto.getRandomValues(bytes); // CSPRNG
  let bin = "";
  for (const byte of bytes) {
    bin += String.fromCharCode(byte);
  }
  return btoa(bin); // safe ASCII string to pass to setEncryptionSecret(...)
}

/**
 * Encrypt an existing (currently unencrypted) SQLite DB in place.
 *
 * @param conn            An OPEN SQLiteDBConnection to the unencrypted DB.
 * @param dbName          The logical database name you used in createConnection(..).
 * @param sqlite          The SQLiteConnection instance you use elsewhere.
 * @param passphraseOpt   Optional passphrase to set/stash if none is stored yet.
 *
 * Notes:
 * - Works on iOS/Android native (not on platform === 'web').
 * - Requires encryption to be enabled in capacitor.config.* for the platforms.
 * - Uses the DB's current PRAGMA user_version as the connection version.
 */
export async function encryptExistingDb(
  dbName: string,
  sqlite: SQLiteConnection,
) {
  const hasSecret = (await sqlite.isSecretStored()).result;
  if (!hasSecret) {
    const pass = generateSqlcipherSecret();
    await sqlite.setEncryptionSecret(pass);
  }

  // 2) If already encrypted, do nothing
  // (If the DB might not exist yet, you can guard with isDatabase() first.)
  const alreadyEncrypted = (await sqlite.isDatabaseEncrypted(dbName)).result;
  if (alreadyEncrypted) {
    return { changed: false };
  }

  // 5) Re-open in "encryption" mode to migrate the file
  const encConn = await sqlite.createConnection(
    dbName,
    /* encrypted */ true,
    /* mode      */ "encryption", // <- one-time upgrade from plaintext
    /* version   */ DB_VERSION,
    /* readonly  */ false,
  );
  try {
    await encConn.open();

    // Quick sanity: plugin says it's encrypted now
    const nowEncrypted = (await sqlite.isDatabaseEncrypted(dbName)).result;
    if (!nowEncrypted) {
      throw new Error(
        `Database "${dbName}" did not report encrypted after migration.`,
      );
    }
  } finally {
    await encConn.close();
  }

  location.reload();

  return { changed: true };
}

function createSqliteStore(rowName?: string) {
  if (!db) {
    const sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);

    db = (async function () {
      try {
        await sqlite.closeConnection(DB_NAME, false);
      } catch {}

      await encryptExistingDb(DB_NAME, sqlite);

      const p = await sqlite.createConnection(
        DB_NAME,
        true,
        "secret",
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

  const setItem = async (key: string, value: string): Promise<void> => {
    const connection = await getDb();
    const fullKey = `${rowName}_${key}`;
    // Use run with value interpolation for INSERT OR REPLACE
    await connection.run(
      `INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)`,
      [fullKey, value],
    );
  };

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

    // iOS crashes if we write too frequently here
    setItem: debounceByKey(setItem, (key) => rowName + key, {
      wait: 2500,
      trailing: true,
    }),

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
      return [sizes, totalSize] as const;
    },
  };
}

export const runTauriSecurityFix = () => {
  if (isTauri()) {
    pRetry(
      async () => {
        const store = await load(DB_NAME);

        const idb = await openDB(DB_NAME, DB_VERSION, {
          upgrade(db) {
            // Check if the store exists, and create it if not
            if (!db.objectStoreNames.contains(TABLE_NAME)) {
              db.createObjectStore(TABLE_NAME);
            }
          },
        });

        let migrated = false;

        try {
          for (const key of await store.keys()) {
            const value = await store.get(key);
            if (value) {
              idb.put(TABLE_NAME, value, key);
              migrated = true;
            }
          }
        } finally {
          await store.reset();
          await store.save();
          if (migrated) {
            location.reload();
          }
        }
      },
      {
        retries: 10,
      },
    );
  }
};

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
  } else {
    return createIdb(rowName);
  }
}

function processDbSizes(db: [string, number][], totalSize: number) {
  return _.entries(
    db.reduce(
      (acc, [key, size]) => {
        if (size / totalSize <= 0.01) {
          acc["Other"] = acc["Other"] ?? 0;
          acc["Other"] += size;
        } else {
          const prettyKey = _.capitalize(
            key.split("_")[1]?.replaceAll("-", " ") ?? key,
          );
          acc[prettyKey] = size;
        }
        return acc;
      },
      {} as Record<string, number>,
    ),
  ).sort(([_aKey, aSize], [_bKey, bSize]) => {
    return bSize - aSize;
  });
}

export async function getDbSizes() {
  const sizes: [string, number][] = [];
  let totalSize = 0;

  if (Capacitor.isNativePlatform()) {
    const db = createSqliteStore();
    return processDbSizes(...(await db.getDbSize()));
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

  return processDbSizes(sizes, totalSize);
}
