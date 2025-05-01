import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createStorage, sync } from "./storage";
import { FlattenedComment } from "../lib/lemmy";
import _ from "lodash";
import { MAX_CACHE_MS } from "./config";
import { CachePrefixer } from "./auth";

type CachedComment = {
  data: FlattenedComment;
  lastUsed: number;
};

type CommentPath = FlattenedComment["comment"]["path"];

type SortsStore = {
  comments: Record<CommentPath, CachedComment>;
  patchComment: (
    path: FlattenedComment["comment"]["path"],
    prefix: CachePrefixer,
    comment: (prev: FlattenedComment) => Partial<FlattenedComment>,
  ) => void;
  cacheComment: (
    prefix: CachePrefixer,
    comment: FlattenedComment,
  ) => FlattenedComment;
  cacheComments: (
    prefix: CachePrefixer,
    comments: FlattenedComment[],
  ) => Record<CommentPath, CachedComment>;
  removeComment: (path: string, prefix: CachePrefixer) => void;
  cleanup: () => any;
};
export const useCommentsStore = create<SortsStore>()(
  persist(
    (set, get) => ({
      comments: {},
      optimisticComments: {},
      patchComment: (path, prefix, patchFn) => {
        const prev = get().comments;
        const cacheKey = prefix(path);
        const prevComment = prev[cacheKey];
        if (!prevComment) {
          console.log("attempted to patch a comment that is not in the cache");
          return;
        }
        const updatedCommentData = {
          ...prevComment.data,
          ...patchFn(prevComment.data),
        };
        if (prevComment) {
          set({
            comments: {
              ...prev,
              [cacheKey]: {
                data: updatedCommentData,
                lastUsed: Date.now(),
              },
            },
          });
        }
        return updatedCommentData;
      },
      removeComment: (path, prefix) => {
        const prev = get().comments;
        const cacheKey = prefix(path);
        set({
          comments: {
            ..._.omit(prev, [cacheKey]),
          },
        });
      },
      cacheComment: (prefix, view) => {
        const prev = get().comments;
        const cacheKey = prefix(view.comment.path);
        const prevPostData = prev[cacheKey]?.data ?? {};
        const updatedPostData = {
          ..._.pick(prevPostData, ["optimisticMyVote"]),
          ...view,
        };
        set({
          comments: {
            ...prev,
            [cacheKey]: {
              data: updatedPostData,
              lastUsed: Date.now(),
            },
          },
        });
        return updatedPostData;
      },
      cacheComments: (prefix, views) => {
        const prev = get().comments;

        const newComments: Record<CommentPath, CachedComment> = {};

        for (const view of views) {
          const cacheKey = prefix(view.comment.path);
          const prevCommentData = prev[cacheKey]?.data ?? {};
          newComments[cacheKey] = {
            data: {
              ..._.pick(prevCommentData, ["optimisticMyVote"]),
              ...view,
            },
            lastUsed: Date.now(),
          };
        }

        const updatedPosts = {
          ...prev,
          ...newComments,
        };

        set({
          comments: updatedPosts,
        });

        return updatedPosts;
      },
      cleanup: () => {
        const now = Date.now();

        const comments = _.clone(get().comments);

        for (const key in comments) {
          const comment = comments[key];
          if (comment) {
            const shouldEvict = now - comment.lastUsed > MAX_CACHE_MS;
            if (shouldEvict) {
              delete comments[key];
            }
          }
        }

        return comments;
      },
    }),
    {
      name: "comments",
      storage: createStorage<SortsStore>(),
      version: 2,
      onRehydrateStorage: () => {
        return (state) => {
          state?.cleanup();
        };
      },
    },
  ),
);

sync(useCommentsStore);
