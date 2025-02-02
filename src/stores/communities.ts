import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createStorage } from "./storage";
import _ from "lodash";
import type {
  Community,
  CommunityView,
  CommunityModeratorView,
  SubscribedType,
} from "lemmy-js-client";
import { createCommunitySlug } from "../lib/lemmy/utils";

type Data = {
  communityView: CommunityView;
  optimisticSubscribed?: SubscribedType;
  mods?: CommunityModeratorView;
};

type CachedCommunity = {
  data: Data;
  lastUsed: number;
};

type SortsStore = {
  communities: Record<string, CachedCommunity>;
  patchCommunity: (id: string, post: Partial<Data>) => Data;
  cacheCommunity: (data: Data) => Data;
  cacheCommunities: (data: Data[]) => Record<string, CachedCommunity>;
};

export const useCommunitiesStore = create<SortsStore>()(
  persist(
    (set, get) => ({
      communities: {},
      patchCommunity: (slug, patch) => {
        const communities = get().communities;
        const prevCommunityData = communities[slug]?.data ?? {};
        const updatedCommunityData = {
          ...prevCommunityData,
          ...patch,
        };
        if (slug in communities) {
          set({
            communities: {
              ...communities,
              [slug]: {
                data: updatedCommunityData,
                lastUsed: Date.now(),
              },
            },
          });
        }
        return updatedCommunityData;
      },
      cacheCommunity: (view) => {
        const slug = createCommunitySlug(view.communityView.community);
        const communities = get().communities;
        const prevCommunityData = communities[slug]?.data ?? {};
        const updatedCommunityData = {
          ...prevCommunityData,
          ...view,
        };
        set({
          communities: {
            ...communities,
            [slug]: {
              data: updatedCommunityData,
              lastUsed: Date.now(),
            },
          },
        });
        return updatedCommunityData;
      },
      cacheCommunities: (views) => {
        const prev = get().communities;

        const newCommunities: Record<string, CachedCommunity> = {};

        for (const view of views) {
          const slug = createCommunitySlug(view.communityView.community);
          const prevCommunityData = prev[slug]?.data ?? {};
          newCommunities[slug] = {
            data: {
              ...prevCommunityData,
              ...view,
            },
            lastUsed: Date.now(),
          };
        }

        const updatedCommunities = {
          ...prev,
          ...newCommunities,
        };

        set({
          communities: updatedCommunities,
        });

        return updatedCommunities;
      },
    }),
    {
      name: "communities",
      storage: createStorage<SortsStore>(),
      version: 0,
    },
  ),
);
