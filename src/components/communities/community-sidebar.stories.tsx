import type { Meta, StoryObj } from "@storybook/react";

import { CommunitySidebar } from "./community-sidebar";

import { useCommunitiesStore } from "@/src/stores/communities";
import { useEffect } from "react";
import * as lemmy from "@/test-utils/lemmy";
import { createCommunitySlug } from "@/src/lib/lemmy/utils";
import { useAuth } from "@/src/stores/auth";

function LoadCommunity() {
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const cacheCommunity = useCommunitiesStore((s) => s.cacheCommunity);

  useEffect(() => {
    const communityView = lemmy.getCommunity();
    cacheCommunity(getCachePrefixer(), {
      communityView,
    });
  }, []);

  return null;
}

//👇 This default export determines where your story goes in the story list
const meta: Meta<typeof CommunitySidebar> = {
  component: CommunitySidebar,
  decorators: (Story) => (
    <>
      <LoadCommunity />
      <Story />
    </>
  ),
};

export default meta;
type Story = StoryObj<typeof CommunitySidebar>;

export const Sidebar: Story = {
  args: {
    communityName: createCommunitySlug(lemmy.getCommunity().community),
    asPage: true,
  },
};
