import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createStorage, sync } from "./storage";
import { useConfirmationAlert } from "../lib/hooks";
import z from "zod";

type InboxStore = {
  userTags: Record<string, string>;
  setUserTag: (userSlug: string, tag: string) => any;
};

export const useTagUserStore = create<InboxStore>()(
  persist(
    (set, get) => ({
      userTags: {},
      setUserTag: (userSlug, tag) => {
        const prev = get().userTags;
        if (!tag.trim()) {
          const clone = { ...prev };
          delete clone[userSlug];
          set({ userTags: clone });
        } else {
          set({
            userTags: {
              ...prev,
              [userSlug]: tag.trim(),
            },
          });
        }
      },
    }),
    {
      name: "user-tags",
      storage: createStorage<InboxStore>(),
      version: 0,
    },
  ),
);

sync(useTagUserStore);

export function useTagUser() {
  const setUserTag = useTagUserStore((s) => s.setUserTag);
  const alrt = useConfirmationAlert();

  return async (userSlug: string, initValue?: string) => {
    const { tag } = await alrt({
      header: userSlug,
      message: "Tag user to identify them later",
      inputs: [
        {
          type: "text",
          name: "tag",
          id: "tag",
          value: initValue,
        },
      ],
      schema: z.object({
        tag: z.string(),
      }),
    });
    setUserTag(userSlug, tag);
  };
}
