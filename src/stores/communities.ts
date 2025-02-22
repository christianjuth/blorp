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
import { MAX_CACHE_MS } from "./config";

type Data = {
  communityView:
    | CommunityView
    | ({ community: Community } & Partial<CommunityView>);
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
  cleanup: () => any;
};

export const useCommunitiesStore = create<SortsStore>()(
  persist(
    (set, get) => ({
      communities: {},
      patchCommunity: (slug, patch) => {
        const communities = get().communities;
        const prevCommunityData = communities[slug]?.data ?? {};
        const updatedCommunityData: Data = {
          ...prevCommunityData,
          ...patch,
          communityView: {
            ...prevCommunityData.communityView,
            ...patch.communityView,
          },
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
        const prev = get();
        const slug = createCommunitySlug(view.communityView.community);
        const prevCommunityData = prev.communities[slug]?.data ?? {};
        const updatedCommunityData: Data = {
          ...prevCommunityData,
          ...view,
          communityView: {
            ...prevCommunityData.communityView,
            ...view.communityView,
          },
        };
        set({
          communities: {
            ...prev.communities,
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
              communityView: {
                ...prevCommunityData.communityView,
                ...view.communityView,
              },
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
      cleanup: () => {
        const now = Date.now();

        const communities = _.clone(get().communities);

        for (const key in communities) {
          const community = communities[key];
          const shouldEvict = now - community.lastUsed > MAX_CACHE_MS;

          if (shouldEvict) {
            delete communities[key];
          }
        }

        return communities;
      },
    }),
    {
      name: "communities",
      storage: createStorage<SortsStore>(),
      version: 0,
    },
  ),
);
