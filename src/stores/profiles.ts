import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createStorage, sync } from "./storage";
import _ from "lodash";
import type { Person, PersonAggregates } from "lemmy-js-client";
import { MAX_CACHE_MS } from "./config";

type Data = {
  person: Person;
  counts?: PersonAggregates;
};

type CachedProfile = {
  data: Data;
  lastUsed: number;
};

type ProfilesStore = {
  profiles: Record<string, CachedProfile>;
  patchProfile: (id: string, post: Partial<Data>) => Data;
  cacheProfiles: (data: Data[]) => Record<string, CachedProfile>;
  cleanup: () => any;
};

export const useProfilesStore = create<ProfilesStore>()(
  persist(
    (set, get) => ({
      profiles: {},
      patchProfile: (apId, patch) => {
        const profiles = get().profiles;
        const prevProfileData = profiles[apId]?.data ?? {};
        const updatedProfileData: Data = {
          ...prevProfileData,
          ...patch,
        };
        set({
          profiles: {
            ...profiles,
            [apId]: {
              data: updatedProfileData,
              lastUsed: Date.now(),
            },
          },
        });
        return updatedProfileData;
      },
      cacheProfiles: (views) => {
        const prev = get().profiles;

        const newProfiles: Record<string, CachedProfile> = {};

        for (const view of views) {
          const actorId = view.person.actor_id;
          const prevProfileData = prev[actorId]?.data ?? {};
          newProfiles[actorId] = {
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
      version: 0,
    },
  ),
);

sync(useProfilesStore);
