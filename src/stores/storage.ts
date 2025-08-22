import { PersistStorage } from "zustand/middleware";
import { createDb } from "@/src/lib/create-storage";
import pRetry from "p-retry";
import { UseBoundStore } from "zustand";
import _ from "lodash";

export function createStorage<S>(): PersistStorage<S> {
  const db = createDb("zustand");

  // If read takes too long, write can override it
  // so we lock writing until read finishes.
  let locked = true;

  return {
    getItem: async (key) => {
      try {
        const value = await pRetry(() => db.getItem(key), {
          retries: 5,
        });
        locked = false;
        return value ? JSON.parse(value) : null;
      } catch (err) {
        console.error(err);
        locked = false;
        return null;
      }
    },
    setItem: async (key, value) => {
      if (!locked) {
        await db.setItem(key, JSON.stringify(value));
      }
    },
    removeItem: async (key) => {
      if (!locked) {
        await db.removeItem(key);
      }
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
