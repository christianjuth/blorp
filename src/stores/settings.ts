import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createStorage } from "./storage";

type SettingsStore = {
  cacheImages: boolean;
  setCacheImages: (newVal: boolean) => any;
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      cacheImages: false,
      setCacheImages: (cacheImages) => set({ cacheImages }),
    }),
    {
      name: "settings",
      storage: createStorage<SettingsStore>(),
      version: 0,
    },
  ),
);
