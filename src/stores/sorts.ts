import { CommentSortType, PostSortType } from "lemmy-js-client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createStorage } from "./storage";

type SortsStore = {
  commentSort: CommentSortType;
  setCommentSort: (sort: CommentSortType) => void;
  postSort: PostSortType;
  setPostSort: (sort: PostSortType) => void;
};

export const useSorts = create<SortsStore>()(
  persist(
    (set) => ({
      commentSort: "Hot",
      setCommentSort: (commentSort) => set({ commentSort }),
      postSort: "Active",
      setPostSort: (postSort) => set({ postSort }),
    }),
    {
      name: "sorts",
      storage: createStorage<SortsStore>(),
    },
  ),
);
