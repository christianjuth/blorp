import { CommentSortType, PostSortType } from "lemmy-js-client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

type SettingsStore = {
  commentSort: CommentSortType;
  setCommentSort: (sort: CommentSortType) => void;
  postSort: PostSortType;
  setPostSort: (sort: PostSortType) => void;
};

export const useSorts = create<SettingsStore>()(
  persist(
    (set) => ({
      commentSort: "Hot",
      setCommentSort: (commentSort) => set({ commentSort }),
      postSort: "Active",
      setPostSort: (postSort) => set({ postSort }),
    }),
    {
      name: "settings",
      storage: {
        getItem: async (key) => {
          const value = await AsyncStorage.getItem(key);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (key, value) => {
          await AsyncStorage.setItem(key, JSON.stringify(value));
        },
        removeItem: async (key) => {
          await AsyncStorage.removeItem(key);
        },
      },
    },
  ),
);
