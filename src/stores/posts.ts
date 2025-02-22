import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createStorage } from "./storage";
import { FlattenedPost } from "../lib/lemmy/utils";
import _ from "lodash";
import { MAX_CACHE_MS } from "./config";

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
  cleanup: () => any;
};

export const usePostsStore = create<SortsStore>()(
  persist(
    (set, get) => ({
      posts: {},
      patchPost: (apId, patch) => {
        const prev = get().posts;
        const prevPost = prev[apId];
        const updatedPostData = {
          ...prevPost.data,
          ...patch,
        };
        if (prevPost) {
          set({
            posts: {
              ...prev,
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
        const prev = get().posts;
        const prevPostData = prev[view.post.ap_id]?.data ?? {};
        const updatedPostData = {
          ...prevPostData,
          ...view,
          optimisticMyVote:
            view.optimisticMyVote ?? prevPostData.optimisticMyVote,
          imageDetails: view.imageDetails ?? prevPostData.imageDetails,
          crossPosts: view.crossPosts ?? prevPostData.crossPosts,
        };
        set({
          posts: {
            ...prev,
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
          const prevPostData = prev[view.post.ap_id]?.data ?? {};
          newPosts[view.post.ap_id] = {
            data: {
              ...prevPostData,
              ...view,
              optimisticMyVote:
                view.optimisticMyVote ?? prevPostData.optimisticMyVote,
              imageDetails: view.imageDetails ?? prevPostData.imageDetails,
              crossPosts: view.crossPosts ?? prevPostData.crossPosts,
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
      cleanup: () => {
        const now = Date.now();

        const posts = _.clone(get().posts);

        for (const key in posts) {
          const post = posts[key];
          const shouldEvict = now - post.lastUsed > MAX_CACHE_MS;

          if (shouldEvict) {
            delete posts[key];
          }
        }

        return posts;
      },
    }),
    {
      name: "posts",
      storage: createStorage<SortsStore>(),
      version: 1,
    },
  ),
);
