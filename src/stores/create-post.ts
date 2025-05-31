import { Community, CreatePost, EditPost } from "lemmy-v3";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createStorage, sync } from "./storage";
import _ from "lodash";
import { FlattenedPost } from "../lib/lemmy/utils";
import dayjs from "dayjs";
import { Schemas } from "../lib/lemmy/adapters/adapter";

export type CommunityPartial = Pick<
  Community,
  "name" | "title" | "icon" | "actor_id"
>;

export interface Draft extends Partial<Omit<CreatePost, "community_id">> {
  type: "text" | "media" | "link";
  createdAt: number;
  community?: {
    apId: string;
    slug: string;
  };
  apId?: string;
}

type CreatePostStore = {
  drafts: Record<string, Draft>;
  updateDraft: (key: string, patch: Partial<Draft>) => void;
  deleteDraft: (key: string) => any;
  cleanup: () => void;
};

export const NEW_DRAFT: Draft = {
  type: "text",
  createdAt: Date.now(),
};

export function isEmptyDraft(draft: Draft) {
  const fields = _.omit(draft, ["type", "apId", "createdAt", "community"]);
  for (const id in fields) {
    if (fields[id as keyof typeof fields]) {
      return false;
    }
  }
  return true;
}

export function postToDraft(post: Schemas.Post): Draft {
  return {
    name: post.title,
    body: post.body ?? "",
    community: {
      apId: post.communityApId,
      slug: post.communitySlug,
    },
    createdAt: dayjs(post.createdAt).toDate().valueOf(),
    type: "text",
    apId: post.apId,
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

  switch (draft.type) {
    case "text":
      delete post.url;
      delete post.custom_thumbnail;
      break;
    case "media":
      post.url = post.custom_thumbnail;
      break;
    case "link":
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

  switch (draft.type) {
    case "text":
      delete post.url;
      delete post.custom_thumbnail;
      break;
    case "media":
      post.url = post.custom_thumbnail;
      break;
    case "link":
  }

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
      cleanup: () => {
        set((prev) => {
          const drafts = { ...prev.drafts };
          for (const key in drafts) {
            if (drafts[key] && isEmptyDraft(drafts[key])) {
              delete drafts[key];
            }
          }
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
      onRehydrateStorage: () => {
        return (state) => {
          if (!alreadyClean) {
            state?.cleanup();
            alreadyClean = true;
          }
        };
      },
    },
  ),
);

let alreadyClean = false;

sync(useCreatePostStore);
