import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createStorage, sync } from "./storage";
import _ from "lodash";
import type {
  Community,
  CommunityView,
  CommunityModeratorView,
  SubscribedType,
} from "lemmy-js-client";
import { createCommunitySlug } from "../lib/lemmy/utils";
import { MAX_CACHE_MS } from "./config";
import { CachePrefixer } from "./auth";

type Data = {
  communityView:
    | CommunityView
    | ({ community: Community } & Partial<CommunityView>);
  optimisticSubscribed?: SubscribedType;
  mods?: CommunityModeratorView[];
};

type CachedCommunity = {
  data: Data;
  lastUsed: number;
};

type SortsStore = {
  communities: Record<string, CachedCommunity>;
  patchCommunity: (
    id: string,
    prefix: CachePrefixer,
    post: Partial<Data>,
  ) => void;
  cacheCommunity: (prefix: CachePrefixer, data: Data) => Data;
  cacheCommunities: (
    prefix: CachePrefixer,
    data: Data[],
  ) => Record<string, CachedCommunity>;
  cleanup: () => any;
};

export const useCommunitiesStore = create<SortsStore>()(
  persist(
    (set, get) => ({
      communities: {},
      patchCommunity: (slug, prefix, patch) => {
        const communities = get().communities;
        const cacheKey = prefix(slug);
        const prevCommunityData = communities[cacheKey]?.data;
        if (!prevCommunityData) {
          console.error(
            "attempted to patch a community that does not exist in the cache",
          );
          return;
        }
        const updatedCommunityData: Data = {
          ...prevCommunityData,
          ...patch,
          communityView: {
            ...prevCommunityData.communityView,
            ...patch.communityView,
          },
        };
        set({
          communities: {
            ...communities,
            [cacheKey]: {
              data: updatedCommunityData,
              lastUsed: Date.now(),
            },
          },
        });
      },
      cacheCommunity: (prefix, view) => {
        const prev = get();
        const slug = createCommunitySlug(view.communityView.community);
        const cacheKey = prefix(slug);
        const prevCommunityData = prev.communities[cacheKey]?.data;
        const updatedCommunityData: Data = {
          ...prevCommunityData,
          ...view,
          communityView: {
            ...prevCommunityData?.communityView,
            ...view.communityView,
          },
        };
        set({
          communities: {
            ...prev.communities,
            [cacheKey]: {
              data: updatedCommunityData,
              lastUsed: Date.now(),
            },
          },
        });
        return updatedCommunityData;
      },
      cacheCommunities: (prefix, views) => {
        const prev = get().communities;

        const newCommunities: Record<string, CachedCommunity> = {};

        for (const view of views) {
          const slug = createCommunitySlug(view.communityView.community);
          const cacheKey = prefix(slug);
          const prevCommunityData = prev[cacheKey]?.data;
          newCommunities[cacheKey] = {
            data: {
              ...prevCommunityData,
              ...view,
              communityView: {
                ...prevCommunityData?.communityView,
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
          if (community) {
            const shouldEvict = now - community.lastUsed > MAX_CACHE_MS;
            if (shouldEvict) {
              delete communities[key];
            }
          }
        }

        return communities;
      },
    }),
    {
      name: "communities",
      storage: createStorage<SortsStore>(),
      version: 1,
    },
  ),
);

sync(useCommunitiesStore);
