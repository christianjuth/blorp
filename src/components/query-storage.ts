import { QueryClient } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { broadcastQueryClient } from "@tanstack/query-broadcast-client-experimental";
import { openDB } from "idb";

export const persist = async (queryClient: QueryClient) => {
  const db = await openDB("ReactQuery", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("react-query-cache")) {
        db.createObjectStore("react-query-cache");
      }
    },
  });

  const persister = {
    persistClient: async (client) => {
      await db.put("react-query-cache", client, "client");
    },
    restoreClient: async () => {
      const cache = await db.get("react-query-cache", "client");
      return cache || undefined;
    },
    removeClient: async () => {
      await db.delete("react-query-cache", "client");
    },
  };

  // Persist the QueryClient state to IndexedDB
  persistQueryClient({
    queryClient,
    persister,
  });

  // Enable multi-tab synchronization
  // broadcastQueryClient({
  //   queryClient,
  //   broadcastChannel: "react-query-sync",
  // });
};
