import type { Meta, StoryObj } from "@storybook/react-vite";

import { YouTubeVideoEmbed } from "./youtube";

//👇 This default export determines where your story goes in the story list
const meta: Meta<typeof YouTubeVideoEmbed> = {
  component: YouTubeVideoEmbed,
};

export default meta;
type Story = StoryObj<typeof YouTubeVideoEmbed>;

export const FirstStory: Story = {
  args: {
    url: "https://www.youtube.com/watch?v=LDU_Txk06tM",
  },
};
