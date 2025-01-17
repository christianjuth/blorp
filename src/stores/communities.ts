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
import { createCommunitySlug } from "../lib/community";

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
  cacheCommunity: (post: Data) => Data;
  cacheCommunities: (post: Data[]) => Record<string, CachedCommunity>;
};

export const useCommunitiesStore = create<SortsStore>()(
  persist(
    (set, get) => ({
      communities: {},
      patchCommunity: (slug, patch) => {
        const communities = get().communities;
        const prevPost = communities[slug];
        const updatedCommunityData = {
          ...prevPost.data,
          ...patch,
        };
        if (prevPost) {
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
        const communities = get().communities;
        const slug = createCommunitySlug(view.communityView.community);
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
          const prevCommunityData = newCommunities[slug]?.data ?? {};
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
