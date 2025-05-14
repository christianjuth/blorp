import type { Meta, StoryObj } from "@storybook/react";

import { VirtualList } from "./virtual-list";
import { FeedPostCard, getPostProps } from "./posts/post";
import * as lemmy from "@/test-utils/lemmy";
import { flattenPost } from "@/src/lib/lemmy/utils";

//👇 This default export determines where your story goes in the story list
const meta: Meta<typeof VirtualList> = {
  component: VirtualList,
};

const POST_FEED = Array.from({ length: 50 }).map((_, index) =>
  getPostProps(
    flattenPost({
      post_view: lemmy.getPost({
        variant: index % 2 === 0 ? "text" : "image",
      }),
    }),
  ),
);

export default meta;
type Story = StoryObj<typeof VirtualList>;

export const Placeholder: Story = {
  args: {
    className: "h-[500px]",
    data: [],
    placeholder: <div className="flex-1 bg-muted mb-2">Placeholder</div>,
    numPlaceholders: 200,
    estimatedItemSize: 24,
  },
};

export const PostFeed: Story = {
  args: {
    className: "h-[500px]",
    data: POST_FEED,
    renderItem: ({ item }) => (
      <FeedPostCard {...(item as (typeof POST_FEED)[number])} />
    ),
    numPlaceholders: 200,
    estimatedItemSize: 24,
  },
};
