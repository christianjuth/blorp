import type { Meta, StoryObj } from "@storybook/react";

import { FeedPostCard, getPostProps } from "./post";
import _ from "lodash";
import * as lemmy from "@/test-utils/lemmy";
import { flattenPost } from "@/src/lib/lemmy/utils";

//👇 This default export determines where your story goes in the story list
const meta: Meta<typeof FeedPostCard> = {
  component: FeedPostCard,
};

export default meta;
type Story = StoryObj<typeof FeedPostCard>;

export const Text: Story = {
  args: {
    ...getPostProps(
      flattenPost({
        post_view: lemmy.getPost({
          variant: "text",
        }),
      }),
    ),
  },
};

export const Image: Story = {
  args: {
    ...getPostProps(
      flattenPost({
        post_view: lemmy.getPost({
          variant: "image",
        }),
      }),
    ),
  },
};

export const Article: Story = {
  args: {
    ...getPostProps(
      flattenPost({
        post_view: lemmy.getPost({
          variant: "article",
        }),
      }),
    ),
  },
};

export const YouTube: Story = {
  args: {
    ...getPostProps(
      flattenPost({
        post_view: lemmy.getPost({
          variant: "youtube",
        }),
      }),
    ),
  },
};
