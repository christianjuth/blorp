import { CommentSortType, ListingType, PostSortType } from "lemmy-js-client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createStorage } from "./storage";

type SortsStore = {
  commentSort: CommentSortType;
  setCommentSort: (sort: CommentSortType) => void;
  postSort: PostSortType;
  setPostSort: (sort: PostSortType) => void;
  homeFilter: ListingType;
  setHomeFilter: (type: ListingType) => void;
};

export const useFiltersStore = create<SortsStore>()(
  persist(
    (set) => ({
      commentSort: "Hot",
      setCommentSort: (commentSort) => set({ commentSort }),
      postSort: "Active",
      setPostSort: (postSort) => set({ postSort }),
      homeFilter: "Local",
      setHomeFilter: (type) =>
        set({
          homeFilter: type,
        }),
    }),
    {
      name: "filters",
      storage: createStorage<SortsStore>(),
    },
  ),
);
