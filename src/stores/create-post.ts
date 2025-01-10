import { Community } from "lemmy-js-client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createStorage } from "./storage";

type CommunityPartial = Pick<
  Community,
  "name" | "id" | "title" | "icon" | "actor_id"
>;

type CreatePostStore = {
  key: number;
  title: string;
  setTitle: (title: string) => any;
  content: string;
  setContent: (content: string) => any;
  community?: CommunityPartial;
  setCommunity: (community: CommunityPartial) => any;
  reset: () => any;
};

export const useCreatePostStore = create<CreatePostStore>()(
  persist(
    (set, get) => ({
      key: 0,
      title: "",
      setTitle: (title) => set({ title }),
      content: "",
      setContent: (content) => set({ content }),
      setCommunity: (community) => set({ community }),
      reset: () =>
        set({
          title: "",
          content: "",
          community: undefined,
          key: get().key + 1,
        }),
    }),
    {
      name: "create-post",
      storage: createStorage<CreatePostStore>(),
    },
  ),
);
