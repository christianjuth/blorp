import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createStorage } from "./storage";

type AuthStore = {
  instance: string;
  jwt?: string;
  setJwt: (jwt: string) => void;
};

export const useAuth = create<AuthStore>()(
  persist(
    (set) => ({
      instance: "https://lemmy.ml",
      setJwt: (jwt) => set({ jwt }),
    }),
    {
      name: "auth",
      storage: createStorage<AuthStore>(),
    },
  ),
);
