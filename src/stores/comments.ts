import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createStorage } from "./storage";
import { FlattenedComment } from "../lib/lemmy";
import _ from "lodash";
import { MAX_CACHE_MS } from "./config";

type CachedComment = {
  data: FlattenedComment;
  lastUsed: number;
};

type CommentPath = FlattenedComment["comment"]["path"];

type SortsStore = {
  comments: Record<CommentPath, CachedComment>;
  patchComment: (
    path: FlattenedComment["comment"]["path"],
    comment: (prev: FlattenedComment) => Partial<FlattenedComment>,
  ) => FlattenedComment;
  cacheComment: (comment: FlattenedComment) => FlattenedComment;
  cacheComments: (
    comments: FlattenedComment[],
  ) => Record<CommentPath, CachedComment>;
  removeComment: (path: string) => void;
  cleanup: () => any;
};
export const useCommentsStore = create<SortsStore>()(
  persist(
    (set, get) => ({
      comments: {},
      optimisticComments: {},
      patchComment: (path, patchFn) => {
        const prev = get().comments;
        const prevComment = prev[path];
        const updatedCommentData = {
          ...prevComment.data,
          ...patchFn(prevComment.data),
        };
        if (prevComment) {
          set({
            comments: {
              ...prev,
              [path]: {
                data: updatedCommentData,
                lastUsed: Date.now(),
              },
            },
          });
        }
        return updatedCommentData;
      },
      removeComment: (path) => {
        const prev = get().comments;
        set({
          comments: {
            ..._.omit(prev, [path]),
          },
        });
      },
      cacheComment: (view) => {
        const prev = get().comments;
        const prevPostData = prev[view.comment.path]?.data ?? {};
        const updatedPostData = {
          ..._.pick(prevPostData, ["optimisticMyVote"]),
          ...view,
        };
        set({
          comments: {
            ...prev,
            [view.comment.path]: {
              data: updatedPostData,
              lastUsed: Date.now(),
            },
          },
        });
        return updatedPostData;
      },
      cacheComments: (views) => {
        const prev = get().comments;

        const newComments: Record<CommentPath, CachedComment> = {};

        for (const view of views) {
          const prevCommentData = prev[view.comment.path]?.data ?? {};
          newComments[view.comment.path] = {
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
          const shouldEvict = now - comment.lastUsed > MAX_CACHE_MS;

          if (shouldEvict) {
            delete comments[key];
          }
        }

        return comments;
      },
    }),
    {
      name: "comments",
      storage: createStorage<SortsStore>(),
      version: 1,
    },
  ),
);
