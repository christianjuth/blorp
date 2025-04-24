import { Community, CreatePost } from "lemmy-js-client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createStorage, sync } from "./storage";

export type CommunityPartial = Pick<
  Community,
  "name" | "id" | "title" | "icon" | "actor_id"
>;

export interface Draft extends Omit<CreatePost, "community_id"> {
  type: "text" | "media" | "link";
  createdAt: number;
  community?: CommunityPartial;
}

type CreatePostStore = {
  drafts: Record<string, Draft>;
  updateDraft: (key: string, patch: Partial<Draft>) => void;
  deleteDraft: (key: string) => any;
};

export const NEW_DRAFT = {
  type: "text",
  createdAt: Date.now(),
};

export function draftToCreatePostData(draft: Draft) {
  const post: Omit<CreatePost, "community_id"> = {
    name: draft.name,
    //community_id: draft.community?.id,
    body: draft.body,
  };

  switch (draft.type) {
    case "text":

    case "link":

    case "media":
      post.url = draft.url;
  }
}

export const useCreatePostStore = create<CreatePostStore>()(
  persist(
    (set) => ({
      drafts: {},
      updateDraft: (key, patch) => {
        set((prev) => {
          const drafts = { ...prev.drafts };
          const prevDraft = drafts[key] ?? NEW_DRAFT;
          drafts[key] = {
            ...prevDraft,
            ...patch,
          };
          return {
            ...prev,
            drafts,
          };
        });
      },
      deleteDraft: (key: string) => {
        set((prev) => {
          const drafts = { ...prev.drafts };
          delete drafts[key];
          return {
            ...prev,
            drafts,
          };
        });
      },
    }),
    {
      name: "create-post",
      storage: createStorage<CreatePostStore>(),
      version: 2,
    },
  ),
);

sync(useCreatePostStore);
