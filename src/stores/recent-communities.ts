import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createStorage, sync } from "./storage";
import _ from "lodash";
import { Schemas } from "../lib/api/adapters/api-blueprint";
import { isTest } from "../lib/device";

type RecentCommunityStore = {
  recentlyVisited: Schemas.Community[];
  update: (c: Schemas.Community) => void;
  reset: () => void;
};

export const MAX_VISITED = 100;

const INIT_STATE = {
  recentlyVisited: [],
};

export const useRecentCommunitiesStore = create<RecentCommunityStore>()(
  persist(
    (set, get) => ({
      ...INIT_STATE,
      update: (comunity) => {
        const prev = get().recentlyVisited;
        const update = _.slice(
          _.uniqBy([comunity, ...prev], (c) => c.apId),
          0,
          MAX_VISITED,
        );
        set({
          recentlyVisited: update,
        });
      },
      reset: () => {
        if (isTest()) {
          set(INIT_STATE);
        }
      },
    }),
    {
      name: "recent-communities",
      storage: createStorage<RecentCommunityStore>(),
      version: 1,
    },
  ),
);

sync(useRecentCommunitiesStore);
