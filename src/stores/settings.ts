import { CommentSortType } from "lemmy-js-client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type SettingsStore = {
  commentSort: CommentSortType;
  setCommentSort: (sort: CommentSortType) => void;
};

export const useSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      commentSort: "Hot",
      setCommentSort: (commentSort) => set({ commentSort }),
    }),
    {
      name: "settings",
    },
  ),
);
