import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createStorage } from "./storage";

type AuthStore = {
  instance: string;
};

export const useAuth = create<AuthStore>()(
  persist(
    (set) => ({
      instance: "https://lemmy.world",
    }),
    {
      name: "sorts",
      storage: createStorage<AuthStore>(),
    },
  ),
);
