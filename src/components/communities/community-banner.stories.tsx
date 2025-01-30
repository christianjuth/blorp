import type { Meta, StoryObj } from "@storybook/react";

import { CommunityBanner } from "./community-banner";

//👇 This default export determines where your story goes in the story list
const meta: Meta<typeof CommunityBanner> = {
  component: CommunityBanner,
};

export default meta;
type Story = StoryObj<typeof CommunityBanner>;

export const Banner: Story = {
  args: {
    communityName: "testing_lemmy_client@lemmy.ml",
  },
};
