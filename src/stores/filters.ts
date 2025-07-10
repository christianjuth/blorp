import { ListingType } from "lemmy-v3";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createStorage, sync } from "./storage";

type SortsStore = {
  communitySort: string;
  setCommunitySort: (sort: string) => void;
  commentSort: string;
  setCommentSort: (sort: string) => void;
  postSort: string;
  setPostSort: (sort: string) => void;
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
