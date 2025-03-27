import pRetry from "p-retry";

const CACHE_VERSON = 2;

import { Persister } from "@tanstack/react-query-persist-client";
import { createDb } from "../lib/create-storage";
import * as Sentry from "@sentry/react";

const db = createDb("react-query");
export const persister: Persister = {
  persistClient: async (client) => {
    await db.setItem("react-query-cache", JSON.stringify(client));
  },
  restoreClient: async () => {
    try {
      const cache = await pRetry(() => db.getItem("react-query-cache"), {
        retries: 5,
        onFailedAttempt: (err) => {
          Sentry.captureException(err);
        },
      });
      return cache ? JSON.parse(cache) : undefined;
    } catch {
      window.location.reload();
    }
  },
  removeClient: async () => {
    await db.removeItem("react-query-cache");
  },
};

// export const persist = async (queryClient: QueryClient) => {
//   // Persist the QueryClient state to AsyncStorage
//   persistQueryClient({
//     queryClient,
//     persister,
//     buster: String(CACHE_VERSON),
//   });

//   return {
//     persister,
//   };
// };
