import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createStorage, sync } from "./storage";

type SidebarStore = {
  // Site sidebar
  siteAboutExpanded: boolean;
  setSiteAboutExpanded: (val: boolean) => void;
  siteCommunitiesExpanded: boolean;
  setSiteCommunitiesExpanded: (val: boolean) => void;
  siteAdminsExpanded: boolean;
  setSiteAdminsExpanded: (val: boolean) => void;

  // Community sidebar
  communityAboutExpanded: boolean;
  setCommunityAboutExpanded: (val: boolean) => void;
  communityModsExpanded: boolean;
  setCommunityModsExpanded: (val: boolean) => void;

  // User sidebar
  personBioExpanded: boolean;
  setPersonBioExpanded: (val: boolean) => void;
};

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      // Site sidebar
      siteAboutExpanded: true,
      setSiteAboutExpanded: (siteAboutExpanded) => set({ siteAboutExpanded }),
      siteCommunitiesExpanded: true,
      setSiteCommunitiesExpanded: (siteCommunitiesExpanded: boolean) =>
        set({ siteCommunitiesExpanded }),
      siteAdminsExpanded: true,
      setSiteAdminsExpanded: (siteAdminsExpanded: boolean) =>
        set({ siteAdminsExpanded }),

      // Community sidebar
      communityAboutExpanded: true,
      setCommunityAboutExpanded: (communityAboutExpanded: boolean) =>
        set({ communityAboutExpanded }),
      communityModsExpanded: true,
      setCommunityModsExpanded: (communityModsExpanded: boolean) =>
        set({ communityModsExpanded }),

      // User sidebar
      personBioExpanded: true,
      setPersonBioExpanded: (personBioExpanded: boolean) =>
        set({ personBioExpanded }),
    }),
    {
      name: "sidebar",
      storage: createStorage<SidebarStore>(),
      version: 0,
    },
  ),
);

sync(useSidebarStore);
