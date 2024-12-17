import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createStorage } from "./storage";
import { FlattenedPost } from "../lib/lemmy";
import _ from "lodash";

type CachedPost = {
  data: FlattenedPost;
  lastUsed: number;
};

type SortsStore = {
  posts: Record<string, CachedPost>;
  cachePost: (post: FlattenedPost) => void;
  cachePosts: (post: FlattenedPost[]) => void;
};

export const usePostsStore = create<SortsStore>()(
  persist(
    (set, get) => ({
      posts: {},
      cachePost: (view) => {
        const posts = get().posts;
        const prevPostData = posts[view.post.id]?.data ?? {};
        set({
          posts: {
            ...posts,
            [view.post.id]: {
              data: {
                ..._.pick(prevPostData, "optimisticMyVote"),
                ...view,
              },
              lastUsed: Date.now(),
            },
          },
        });
      },
      cachePosts: (views) => {
        const prev = get().posts;

        const newPosts: Record<string, CachedPost> = {};

        for (const view of views) {
          const prevPostData = newPosts[view.post.id]?.data ?? {};
          newPosts[view.post.id] = {
            data: {
              ..._.pick(prevPostData, "optimisticMyVote"),
              ...view,
            },
            lastUsed: Date.now(),
          };
        }

        set({
          posts: {
            ...prev,
            ...newPosts,
          },
        });
      },
    }),
    {
      name: "posts",
      storage: createStorage<SortsStore>(),
    },
  ),
);
