import type { Meta, StoryObj } from "@storybook/react";

import { CommunitySidebar } from "./community-sidebar";

//👇 This default export determines where your story goes in the story list
const meta: Meta<typeof CommunitySidebar> = {
  component: CommunitySidebar,
};

export default meta;
type Story = StoryObj<typeof CommunitySidebar>;

export const Sidebar: Story = {
  args: {
    communityName: "testing_lemmy_client@lemmy.ml",
  },
};
