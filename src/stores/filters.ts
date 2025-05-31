import {
  CommunitySortType,
  CommentSortType,
  ListingType,
  PostSortType,
} from "lemmy-v3";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createStorage, sync } from "./storage";

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
      setCommunitiesListingType: (communitiesListingType) =>
        set({
          communitiesListingType,
        }),
    }),
    {
      name: "filters",
      storage: createStorage<SortsStore>(),
      version: 0,
    },
  ),
);

sync(useFiltersStore);
