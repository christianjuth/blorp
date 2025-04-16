import { Community } from "lemmy-js-client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createStorage, sync } from "./storage";
import _ from "lodash";

type CommunityPartial = Pick<
  Community,
  "name" | "id" | "title" | "icon" | "actor_id"
>;

type RecentCommunityStore = {
  recentlyVisited: CommunityPartial[];
  update: (c: CommunityPartial) => void;
};

export const MAX_VISITED = 100;

export const useRecentCommunitiesStore = create<RecentCommunityStore>()(
  persist(
    (set, get) => ({
      recentlyVisited: [],
      update: (comunity) => {
        const partialCommunity = _.pick(comunity, [
          "name",
          "id",
          "title",
          "icon",
          "actor_id",
        ]);
        const prev = get().recentlyVisited;
        const update = _.slice(
          _.uniqBy([partialCommunity, ...prev], "actor_id"),
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
      version: 0,
    },
  ),
);

sync(useRecentCommunitiesStore);
