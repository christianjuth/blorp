import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createStorage, sync } from "./storage";
import { FlattenedPost } from "../lib/lemmy/utils";
import _ from "lodash";
import { MAX_CACHE_MS } from "./config";
import { CacheKey, CachePrefixer } from "./auth";

type CachedPost = {
  data: FlattenedPost;
  lastUsed: number;
};

type SortsStore = {
  posts: Record<CacheKey, CachedPost>;
  patchPost: (
    id: FlattenedPost["post"]["ap_id"],
    prefix: CachePrefixer,
    post: Partial<FlattenedPost>,
  ) => void;
  cachePost: (prefix: CachePrefixer, post: FlattenedPost) => FlattenedPost;
  cachePosts: (
    prefix: CachePrefixer,
    post: FlattenedPost[],
  ) => Record<string, CachedPost>;
  cleanup: () => any;
};

export const usePostsStore = create<SortsStore>()(
  persist(
    (set, get) => ({
      posts: {},
      patchPost: (apId, prefix, patch) => {
        const prev = get().posts;
        const cacheKey = prefix(apId);
        const prevPost = prev[cacheKey];
        if (!prevPost) {
          console.error("failed to patch post that isn't in cache");
          return;
        }
        const updatedPostData = {
          ...prevPost.data,
          ...patch,
        };
        if (prevPost) {
          set({
            posts: {
              ...prev,
              [cacheKey]: {
                data: updatedPostData,
                lastUsed: Date.now(),
              },
            },
          });
        }
        return updatedPostData;
      },
      cachePost: (prefix, view) => {
        const prev = get().posts;
        const cacheKey = prefix(view.post.ap_id);
        const prevPostData = prev[cacheKey]?.data;
        const updatedPostData = {
          ...prevPostData,
          ...view,
          imageDetails: view.imageDetails ?? prevPostData?.imageDetails,
          crossPosts: view.crossPosts ?? prevPostData?.crossPosts,
        };
        set({
          posts: {
            ...prev,
            [cacheKey]: {
              data: updatedPostData,
              lastUsed: Date.now(),
            },
          },
        });
        return updatedPostData;
      },
      cachePosts: (prefix, views) => {
        const prev = get().posts;

        const newPosts: Record<string, CachedPost> = {};

        for (const view of views) {
          const cacheKey = prefix(view.post.ap_id);
          const prevPostData = prev[cacheKey]?.data;
          newPosts[cacheKey] = {
            data: {
              ...prevPostData,
              ...view,
              imageDetails: view.imageDetails ?? prevPostData?.imageDetails,
              crossPosts: view.crossPosts ?? prevPostData?.crossPosts,
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

        for (const k in posts) {
          const key = k as keyof typeof posts;
          const post = posts[key];
          if (post) {
            const shouldEvict = now - post.lastUsed > MAX_CACHE_MS;
            if (shouldEvict) {
              delete posts[key];
            }
          }
        }

        return posts;
      },
    }),
    {
      name: "posts",
      storage: createStorage<SortsStore>(),
      version: 4,
    },
  ),
);

sync(usePostsStore);
