import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createStorage, sync } from "./storage";
import _ from "lodash";
import { Schemas } from "../lib/lemmy/adapters/api-blueprint";

type RecentCommunityStore = {
  recentlyVisited: Schemas.Community[];
  update: (c: Schemas.Community) => void;
};

export const MAX_VISITED = 100;

export const useRecentCommunitiesStore = create<RecentCommunityStore>()(
  persist(
    (set, get) => ({
      recentlyVisited: [],
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
    }),
    {
      name: "recent-communities",
      storage: createStorage<RecentCommunityStore>(),
      version: 1,
    },
  ),
);

sync(useRecentCommunitiesStore);
