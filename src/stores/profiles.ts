import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createStorage, sync } from "./storage";
import _ from "lodash";
import type { Person, PersonAggregates } from "lemmy-js-client";
import { MAX_CACHE_MS } from "./config";
import { CacheKey, CachePrefixer } from "./auth";

type Data = {
  person: Person;
  counts?: PersonAggregates;
};

type CachedProfile = {
  data: Data;
  lastUsed: number;
};

type ProfilesStore = {
  profiles: Record<CacheKey, CachedProfile>;
  patchProfile: (
    id: string,
    prefixer: CachePrefixer,
    post: Partial<Data>,
  ) => void;
  cacheProfiles: (
    prefixer: CachePrefixer,
    data: Data[],
  ) => Record<string, CachedProfile>;
  cleanup: () => any;
};

export const useProfilesStore = create<ProfilesStore>()(
  persist(
    (set, get) => ({
      profiles: {},
      patchProfile: (apId, prefix, patch) => {
        const profiles = get().profiles;
        const cacheKey = prefix(apId);
        const prevProfileData = profiles[cacheKey]?.data;
        // TODO: techincailly we could allow this
        // so long as patch contains person
        if (!prevProfileData) {
          console.error("failed to patch person that is not in cache");
          return;
        }
        const updatedProfileData: Data = {
          ...prevProfileData,
          ...patch,
        };
        set({
          profiles: {
            ...profiles,
            [cacheKey]: {
              data: updatedProfileData,
              lastUsed: Date.now(),
            },
          },
        });
        return updatedProfileData;
      },
      cacheProfiles: (prefix, views) => {
        const prev = get().profiles;

        const newProfiles: Record<string, CachedProfile> = {};

        for (const view of views) {
          const cacheKey = prefix(view.person.actor_id);
          const prevProfileData = prev[cacheKey]?.data ?? {};
          newProfiles[cacheKey] = {
            data: {
              ...prevProfileData,
              ...view,
            },
            lastUsed: Date.now(),
          };
        }

        const updatedProfiles = {
          ...prev,
          ...newProfiles,
        };

        set({
          profiles: updatedProfiles,
        });

        return updatedProfiles;
      },
      cleanup: () => {
        const now = Date.now();

        const profiles = _.clone(get().profiles);

        for (const key in profiles) {
          const community = profiles[key];
          const shouldEvict = now - community.lastUsed > MAX_CACHE_MS;

          if (shouldEvict) {
            delete profiles[key];
          }
        }

        return profiles;
      },
    }),
    {
      name: "profiles",
      storage: createStorage<ProfilesStore>(),
      version: 1,
    },
  ),
);

sync(useProfilesStore);
