import { PersistStorage } from "zustand/middleware";
import { createDb } from "~/src/lib/create-storage";

export function createStorage<S>(): PersistStorage<S> {
  const db = createDb("zustand");
  return {
    getItem: async (key) => {
      const value = await db.getItem(key);
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
