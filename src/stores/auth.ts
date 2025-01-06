import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createStorage } from "./storage";
import { GetSiteResponse } from "lemmy-js-client";
import _ from "lodash";

const DEFAULT_INSTANCES = [
  "https://lemmy.world",
  "https://lemm.ee",
  "https://sh.itjust.works",
  "https://lemmy.ml",
  "https://lemmy.zip",
  "https://lemmy.ca",
];

type AuthStore = {
  instance?: string;
  setInstance: (instance: string | undefined) => void;
  jwt?: string;
  setJwt: (jwt: string | undefined) => void;
  site?: GetSiteResponse;
  setSite: (site: GetSiteResponse | undefined) => void;
};

export const useAuth = create<AuthStore>()(
  persist(
    (set) => ({
      instance: _.sample(DEFAULT_INSTANCES),
      setInstance: (instance) => set({ instance }),
      setJwt: (jwt) => set({ jwt }),
      setSite: (site) => set({ site }),
    }),
    {
      name: "auth",
      storage: createStorage<AuthStore>(),
    },
  ),
);
