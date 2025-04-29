import { Community, CreatePost, EditPost } from "lemmy-js-client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createStorage, sync } from "./storage";
import _ from "lodash";
import { FlattenedPost } from "../lib/lemmy/utils";
import dayjs from "dayjs";

export type CommunityPartial = Pick<
  Community,
  "name" | "title" | "icon" | "actor_id"
>;

export interface Draft extends Partial<Omit<CreatePost, "community_id">> {
  type: "text" | "media" | "link";
  createdAt: number;
  community?: CommunityPartial;
  apId?: string;
}

type CreatePostStore = {
  drafts: Record<string, Draft>;
  updateDraft: (key: string, patch: Partial<Draft>) => void;
  deleteDraft: (key: string) => any;
};

export const NEW_DRAFT: Draft = {
  type: "text",
  createdAt: Date.now(),
};

export function postToDraft(post: FlattenedPost): Draft {
  return {
    name: post.post.name,
    body: post.post.body,
    community: {
      ...post.community,
      actor_id: post.community.actorId,
    },
    createdAt: dayjs(post.post.published).toDate().valueOf(),
    type: "text",
    apId: post.post.ap_id,
  };
}

export function draftToEditPostData(draft: Draft, post_id: number): EditPost {
  if (!draft.name) {
    throw new Error("post name is required");
  }
  const post: EditPost = {
    ...draft,
    post_id,
    name: draft.name,
    body: draft.body,
  };

  if (draft.type === "media") {
    post.url = post.custom_thumbnail;
  }
  if (!post.url) {
    delete post.url;
  }
  if (!post.custom_thumbnail) {
    delete post.custom_thumbnail;
  }

  return post;
}

export function draftToCreatePostData(
  draft: Draft,
  community_id: number,
): CreatePost {
  if (!draft.name) {
    throw new Error("post name is required");
  }
  const post: CreatePost = {
    ...draft,
    name: draft.name,
    community_id,
    body: draft.body,
  };

  if (!post.url) {
    delete post.url;
  }
  if (!post.custom_thumbnail) {
    delete post.custom_thumbnail;
  }

  return post;
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
      version: 4,
    },
  ),
);

sync(useCreatePostStore);
