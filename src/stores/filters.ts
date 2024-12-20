import {
  CommunitySortType,
  CommentSortType,
  ListingType,
  PostSortType,
} from "lemmy-js-client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createStorage } from "./storage";

type SortsStore = {
  communitySort: CommunitySortType;
  setCommunitySort: (sort: CommunitySortType) => void;
  commentSort: CommentSortType;
  setCommentSort: (sort: CommentSortType) => void;
  postSort: PostSortType;
  setPostSort: (sort: PostSortType) => void;
  homeFilter: ListingType;
  setHomeFilter: (type: ListingType) => void;
  communityFilter: ListingType;
  setCommunityFilter: (type: ListingType) => void;
};

export const useFiltersStore = create<SortsStore>()(
  persist(
    (set) => ({
      communitySort: "Active",
      setCommunitySort: (communitySort) => set({ communitySort }),
      commentSort: "Hot",
      setCommentSort: (commentSort) => set({ commentSort }),
      postSort: "Active",
      setPostSort: (postSort) => set({ postSort }),
      communityFilter: "All",
      setCommunityFilter: (type) =>
        set({
          communityFilter: type,
        }),
      homeFilter: "All",
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
