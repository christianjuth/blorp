import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createStorage, sync } from "./storage";

type SettingsStore = {
  showMarkdown: boolean;
  setShowMarkdown: (newVal: boolean) => any;
  cacheImages: boolean;
  setCacheImages: (newVal: boolean) => any;
  hideRead: boolean;
  setHideRead: (newVal: boolean) => any;
  filterKeywords: string[];
  setFilterKeywords: (update: { index: number; keyword: string }) => any;
  pruneFiltersKeywords: () => any;
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      showMarkdown: false,
      setShowMarkdown: (showMarkdown) => set({ showMarkdown }),
      cacheImages: false,
      setCacheImages: (cacheImages) => set({ cacheImages }),
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

sync(useSettingsStore);
