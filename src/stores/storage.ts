import { PersistStorage } from "zustand/middleware";
import { createDb } from "~/src/lib/create-storage";
import pRetry from "p-retry";
import * as Sentry from "@sentry/react";

export function createStorage<S>(): PersistStorage<S> {
  const db = createDb("zustand");
  return {
    getItem: async (key) => {
      try {
        const value = await pRetry(() => db.getItem(key), {
          retries: 5,
          onFailedAttempt: (err) => {
            Sentry.captureException(err);
          },
        });
        return value ? JSON.parse(value) : null;
      } catch (err) {
        Sentry.captureException(err);
        window.location.reload();
      }
    },
    setItem: async (key, value) => {
      await db.setItem(key, JSON.stringify(value));
    },
    removeItem: async (key) => {
      await db.removeItem(key);
    },
  };
}
