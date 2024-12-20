import { QueryClient } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createDb } from "../lib/create-storage";

export const persist = async (queryClient: QueryClient) => {
  const db = createDb("react-query");
  const persister = {
    persistClient: async (client) => {
      await db.setItem("react-query-cache", JSON.stringify(client));
    },
    restoreClient: async () => {
      const cache = await db.getItem("react-query-cache");
      return cache ? JSON.parse(cache) : undefined;
    },
    removeClient: async () => {
      await db.removeItem("react-query-cache");
    },
  };

  // Persist the QueryClient state to AsyncStorage
  persistQueryClient({
    queryClient,
    persister,
  });
};
