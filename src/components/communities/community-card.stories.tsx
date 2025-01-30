import type { Meta, StoryObj } from "@storybook/react";

import { SmallCommunityCard } from "./community-card";
import _ from "lodash";
import * as lemmy from "~/test-utils/lemmy";

//👇 This default export determines where your story goes in the story list
const meta: Meta<typeof SmallCommunityCard> = {
  component: SmallCommunityCard,
};

export default meta;
type Story = StoryObj<typeof SmallCommunityCard>;

export const Card: Story = {
  args: {
    community: lemmy.getCommunity().community,
  },
};
