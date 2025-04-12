import { Community } from "lemmy-js-client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createStorage } from "./storage";

export type CommunityPartial = Pick<
  Community,
  "name" | "id" | "title" | "icon" | "actor_id"
>;

type CreatePostStore = {
  key: number;
  title: string;
  setTitle: (title: string) => any;
  url?: string;
  setUrl: (url: string) => any;
  content: string;
  thumbnailUrl?: string;
  setThumbnailUrl: (url: string | undefined) => any;
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
      setUrl: (url) => set({ url }),
      setTitle: (title) => set({ title }),
      content: "",
      setContent: (content) => set({ content }),
      setThumbnailUrl: (thumbnailUrl) => set({ thumbnailUrl }),
      setCommunity: (community) => set({ community }),
      reset: () =>
        set({
          title: "",
          content: "",
          community: undefined,
          key: get().key + 1,
          url: undefined,
        }),
    }),
    {
      name: "create-post",
      storage: createStorage<CreatePostStore>(),
      version: 0,
    },
  ),
);
