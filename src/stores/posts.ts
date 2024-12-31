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
  patchPost: (
    id: FlattenedPost["post"]["ap_id"],
    post: Partial<FlattenedPost>,
  ) => FlattenedPost;
  cachePost: (post: FlattenedPost) => FlattenedPost;
  cachePosts: (post: FlattenedPost[]) => Record<string, CachedPost>;
};

export const usePostsStore = create<SortsStore>()(
  persist(
    (set, get) => ({
      posts: {},
      patchPost: (apId, patch) => {
        const posts = get().posts;
        const prevPost = posts[apId];
        const updatedPostData = {
          ...prevPost.data,
          ...patch,
        };
        if (prevPost) {
          set({
            posts: {
              ...posts,
              [apId]: {
                data: updatedPostData,
                lastUsed: Date.now(),
              },
            },
          });
        }
        return updatedPostData;
      },
      cachePost: (view) => {
        const posts = get().posts;
        const prevPostData = posts[view.post.ap_id]?.data ?? {};
        const updatedPostData = {
          ..._.pick(prevPostData, ["optimisticMyVote", "imageDetails"]),
          ...view,
        };
        set({
          posts: {
            ...posts,
            [view.post.ap_id]: {
              data: updatedPostData,
              lastUsed: Date.now(),
            },
          },
        });
        return updatedPostData;
      },
      cachePosts: (views) => {
        const prev = get().posts;

        const newPosts: Record<string, CachedPost> = {};

        for (const view of views) {
          const prevPostData = newPosts[view.post.ap_id]?.data ?? {};
          newPosts[view.post.ap_id] = {
            data: {
              ..._.pick(prevPostData, ["optimisticMyVote", "imageDetails"]),
              ...view,
            },
            lastUsed: Date.now(),
          };
        }

        const updatedPosts = {
          ...prev,
          ...newPosts,
        };

        set({
          posts: updatedPosts,
        });

        return updatedPosts;
      },
    }),
    {
      name: "posts",
      storage: createStorage<SortsStore>(),
    },
  ),
);
