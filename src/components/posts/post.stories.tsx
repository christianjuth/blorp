import type { Meta, StoryObj } from "@storybook/react-vite";

import { FeedPostCard } from "./post";
import _ from "lodash";
import * as api from "@/test-utils/api";
import { usePostsStore } from "@/src/stores/posts";
import { useEffect } from "react";
import { useAuth } from "@/src/stores/auth";

const textPost = api.getPost({
  variant: "text",
  post: { id: api.randomDbId() },
});
const imgPost = api.getPost({
  variant: "image",
  post: { id: api.randomDbId() },
});
const articlePost = api.getPost({
  variant: "article",
  post: { id: api.randomDbId() },
});
const youtubePost = api.getPost({
  variant: "youtube",
  post: { id: api.randomDbId() },
});

function LoadData() {
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const cachePosts = usePostsStore((s) => s.cachePosts);

  useEffect(() => {
    cachePosts(getCachePrefixer(), [
      textPost.post,
      imgPost.post,
      articlePost.post,
      youtubePost.post,
    ]);
  }, []);

  return null;
}

//👇 This default export determines where your story goes in the story list
const meta: Meta<typeof FeedPostCard> = {
  component: FeedPostCard,
  decorators: (Story) => {
    return (
      <>
        <LoadData />
        <Story />
      </>
    );
  },
};

export default meta;
type Story = StoryObj<typeof FeedPostCard>;

export const Text: Story = {
  args: {
    apId: textPost.post.apId,
  },
};

export const Image: Story = {
  args: {
    apId: imgPost.post.apId,
  },
};

export const Article: Story = {
  args: {
    apId: articlePost.post.apId,
  },
};

export const YouTube: Story = {
  args: {
    apId: youtubePost.post.apId,
  },
};
