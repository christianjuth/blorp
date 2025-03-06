import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createStorage } from "./storage";

type SettingsStore = {
  cacheImages: boolean;
  setCacheImages: (newVal: boolean) => any;
  showNsfw: boolean;
  setShowNsfw: (newVal: boolean) => any;
  hideRead: boolean;
  setHideRead: (newVal: boolean) => any;
  filterKeywords: string[];
  setFilterKeywords: (update: { index: number; keyword: string }) => any;
  pruneFiltersKeywords: () => any;
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      cacheImages: false,
      setCacheImages: (cacheImages) => set({ cacheImages }),
      showNsfw: false,
      setShowNsfw: (showNsfw) => set({ showNsfw }),
      hideRead: false,
      setHideRead: (hideRead) => set({ hideRead }),
      filterKeywords: [],
      setFilterKeywords: (update) => {
        const filterKeywords = [...get().filterKeywords];
        filterKeywords[update.index] = update.keyword;
        set({
          filterKeywords,
        });
      },
      pruneFiltersKeywords: () => {
        const filterKeywords = [...get().filterKeywords].filter(Boolean);
        set({ filterKeywords });
      },
    }),
    {
      name: "settings",
      storage: createStorage<SettingsStore>(),
      version: 0,
    },
  ),
);
