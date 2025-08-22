import { PersistStorage } from "zustand/middleware";
import { createDb } from "@/src/lib/create-storage";
import pRetry from "p-retry";
import { UseBoundStore } from "zustand";
import _ from "lodash";

export function createStorage<S>(): PersistStorage<S> {
  const db = createDb("zustand");
  return {
    getItem: async (key) => {
      const value = await pRetry(() => db.getItem(key), {
        retries: 3,
      });
      return value ? JSON.parse(value) : null;
    },
    setItem: async (key, value) => {
      await db.setItem(key, JSON.stringify(value));
    },
    removeItem: async (key) => {
      await db.removeItem(key);
    },
  };
}

export function sync(store: UseBoundStore<any>) {
  const debouncedRehydrate = _.debounce(store.persist.rehydrate, 50);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      debouncedRehydrate();
    }
  });
  window.addEventListener("focus", debouncedRehydrate);
}
