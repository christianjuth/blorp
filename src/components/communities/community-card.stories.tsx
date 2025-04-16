import type { Meta, StoryObj } from "@storybook/react";

import { CommunityCard } from "./community-card";
import _ from "lodash";
import * as lemmy from "@/test-utils/lemmy";

//👇 This default export determines where your story goes in the story list
const meta: Meta<typeof CommunityCard> = {
  component: CommunityCard,
};

export default meta;
type Story = StoryObj<typeof CommunityCard>;

export const Card: Story = {
  args: {
    communityView: lemmy.getCommunity().community,
    size: "md",
  },
};
