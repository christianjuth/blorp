import { openDB } from "idb";

export interface StoragePersister {
  persistClient: (client: unknown) => Promise<void>;
  restoreClient: () => Promise<unknown | undefined>;
  removeClient: () => Promise<void>;
}

export const createStoragePersister = async () => {
  const db = await openDB("ReactQuery", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("react-query-cache")) {
        db.createObjectStore("react-query-cache");
      }
    },
  });

  return {
    persistClient: async (client) => {
      await db.put("react-query-cache", client, "client");
    },
    restoreClient: async () => {
      return await db.get("react-query-cache", "client");
    },
    removeClient: async () => {
      await db.delete("react-query-cache", "client");
    },
  };
};
