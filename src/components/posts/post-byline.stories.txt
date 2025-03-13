import type { Meta, StoryObj } from "@storybook/react";

import { PostByline } from "./post-byline";
import _ from "lodash";
import * as lemmy from "~/test-utils/lemmy";
import { flattenPost } from "~/src/lib/lemmy/utils";

//👇 This default export determines where your story goes in the story list
const meta: Meta<typeof PostByline> = {
  component: PostByline,
};

export default meta;
type Story = StoryObj<typeof PostByline>;

export const Byline: Story = {
  args: {
    postView: flattenPost({
      post_view: lemmy.getPost(),
    }),
  },
};
