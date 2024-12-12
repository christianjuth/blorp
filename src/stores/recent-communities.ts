import { Community } from "lemmy-js-client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createStorage } from "./storage";
import _ from "lodash";

type CommunityPartial = Pick<Community, "name" | "id" | "title" | "icon">;

type RecentCommunityStore = {
  recentlyVisited: CommunityPartial[];
  update: (c: CommunityPartial) => void;
};

const MAX_VISITED = 5;

export const useRecentCommunities = create<RecentCommunityStore>()(
  persist(
    (set, get) => ({
      recentlyVisited: [],
      update: (comunity) => {
        const partialCommunity = _.pick(comunity, [
          "name",
          "id",
          "title",
          "icon",
        ]);
        const prev = get().recentlyVisited;
        const update = _.slice(
          _.uniqBy([partialCommunity, ...prev], "id"),
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
    },
  ),
);
