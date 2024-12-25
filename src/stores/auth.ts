import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createStorage } from "./storage";

type AuthStore = {
  instance?: string;
  setInstance: (instance: string) => void;
  jwt?: string;
  setJwt: (jwt: string | undefined) => void;
};

export const useAuth = create<AuthStore>()(
  persist(
    (set) => ({
      setInstance: (instance: string | undefined) => set({ instance }),
      setJwt: (jwt) => set({ jwt }),
    }),
    {
      name: "auth",
      storage: createStorage<AuthStore>(),
    },
  ),
);
