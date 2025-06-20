import type { Meta, StoryObj } from "@storybook/react-vite";

import { CommunityBanner } from "./community-banner";
import { useCommunitiesStore } from "@/src/stores/communities";
import { useEffect } from "react";
import * as api from "@/test-utils/api";
import { createSlug } from "@/src/lib/lemmy/utils";
import { useAuth } from "@/src/stores/auth";

const COMMUNITY = api.getCommunity();

function LoadCommunity() {
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const cacheCommunity = useCommunitiesStore((s) => s.cacheCommunity);

  useEffect(() => {
    cacheCommunity(getCachePrefixer(), {
      communityView: COMMUNITY,
    });
  }, []);

  return null;
}

//👇 This default export determines where your story goes in the story list
const meta: Meta<typeof CommunityBanner> = {
  component: CommunityBanner,
  decorators: (Story) => (
    <>
      <LoadCommunity />
      <Story />
    </>
  ),
};

export default meta;
type Story = StoryObj<typeof CommunityBanner>;

export const Banner: Story = {
  args: {
    communityName: createSlug(COMMUNITY, true).slug,
  },
};
