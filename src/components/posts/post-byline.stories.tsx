import type { Meta, StoryObj } from "@storybook/react";

import { PostByline } from "./post-byline";
import _ from "lodash";
import * as api from "@/test-utils/api";

const postView = api.getPost();

//👇 This default export determines where your story goes in the story list
const meta: Meta<typeof PostByline> = {
  component: PostByline,
};

export default meta;
type Story = StoryObj<typeof PostByline>;

export const Byline: Story = {
  args: {
    post: postView.post,
  },
};
