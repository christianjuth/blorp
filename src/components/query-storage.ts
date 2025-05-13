import pRetry from "p-retry";

import { Persister } from "@tanstack/react-query-persist-client";
import { createDb } from "../lib/create-storage";
import { isDev } from "../lib/device";

const db = createDb("react-query");
export const persister: Persister = {
  persistClient: async (client) => {
    await db.setItem("react-query-cache", JSON.stringify(client));
  },
  restoreClient: async () => {
    try {
      const cache = await pRetry(() => db.getItem("react-query-cache"), {
        retries: 5,
      });
      return cache ? JSON.parse(cache) : undefined;
    } catch (err) {
      console.error(err);
      if (!isDev()) {
        window.location.reload();
      }
    }
  },
  removeClient: async () => {
    await db.removeItem("react-query-cache");
  },
};
