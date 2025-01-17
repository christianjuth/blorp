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
  listingType: ListingType;
  setListingType: (type: ListingType) => void;
  communitiesListingType: ListingType;
  setCommunitiesListingType: (type: ListingType) => void;
};

export const useFiltersStore = create<SortsStore>()(
  persist(
    (set) => ({
      communitySort: "TopAll",
      setCommunitySort: (communitySort) => set({ communitySort }),
      commentSort: "Hot",
      setCommentSort: (commentSort) => set({ commentSort }),
      postSort: "Active",
      setPostSort: (postSort) => set({ postSort }),
      listingType: "All",
      setListingType: (listingType) =>
        set({
          listingType,
        }),
      communitiesListingType: "All",
      setCommunitiesListingType: (listingType) =>
        set({
          listingType,
        }),
    }),
    {
      name: "filters",
      storage: createStorage<SortsStore>(),
      version: 0,
    },
  ),
);
