import type { Meta, StoryObj } from "@storybook/react";

import { PostCard } from "./post";
import { usePostsStore } from "~/src/stores/posts";
import _ from "lodash";
import { useEffect } from "react";
import * as lemmy from "~/test-utils/lemmy";
import { flattenPost } from "~/src/lib/lemmy";

function LoadPost({ variant }: { variant: "image" | "youtube" }) {
  const cachePost = usePostsStore((s) => s.cachePost);

  useEffect(() => {
    const postView = lemmy.getPost({
      variant,
    });

    console.log(postView);
    cachePost(
      flattenPost({
        post_view: postView,
      }),
    );
  }, [variant]);

  return null;
}

//👇 This default export determines where your story goes in the story list
const meta: Meta<typeof PostCard> = {
  component: PostCard,
};

export default meta;
type Story = StoryObj<typeof PostCard>;

const AP_ID = lemmy.getPost().post.ap_id;

export const Image: Story = {
  args: {
    apId: AP_ID,
    featuredContext: "community",
  },
  argTypes: {
    featuredContext: {
      control: "select",
      options: ["community", undefined],
    },
  },
  decorators: (Story) => (
    <>
      <LoadPost variant="image" />
      <Story />
    </>
  ),
};

export const YouTube: Story = {
  args: {
    apId: AP_ID,
    featuredContext: "community",
  },
  argTypes: {
    featuredContext: {
      control: "select",
      options: ["community", undefined],
    },
  },
  decorators: (Story) => (
    <>
      <LoadPost variant="youtube" />
      <Story />
    </>
  ),
};
