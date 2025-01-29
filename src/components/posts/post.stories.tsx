import type { Meta, StoryObj } from "@storybook/react";

import { PostCard } from "./post";
import { usePostsStore } from "~/src/stores/posts";
import { FlattenedPost } from "~/src/lib/lemmy";
import dayjs from "dayjs";
import utcPlugin from "dayjs/plugin/utc";
import _ from "lodash";
import { createCommunitySlug } from "~/src/lib/community";
import { Community } from "lemmy-js-client";
import { useEffect } from "react";

dayjs.extend(utcPlugin);

const uuid = () => _.random(2000, 200000);
const timestamp = () =>
  dayjs().utc().subtract(1, "hour").format("YYYY-MM-DDTHH:mm:ss.SSS[000]Z");

const IMAGE_DIMENSIONS = {
  height: 200,
  width: 300,
};
const IMAGE = `https://picsum.photos/id/10/${IMAGE_DIMENSIONS.width}/${IMAGE_DIMENSIONS.height}`;
const AP_ID = "https://lemmy.world/post/24819939";
const POST_ID = uuid();
const POST_PUBLISHED_AT = timestamp();
const CREATOR_ID = uuid();
const COMMUNITY_ID = uuid();

const YOUTUBE = "https://www.youtube.com/watch?v=LDU_Txk06tM";

const COMMUNITY = {
  name: "mems",
  title: "Memes",
  actor_id: "https://lemmy.world/",
} satisfies Partial<Community>;

const createPost: (variant: "image" | "youtube") => FlattenedPost = (
  variant,
) => ({
  post: {
    id: POST_ID,
    name: "This is a test post",
    creator_id: CREATOR_ID,
    community_id: COMMUNITY_ID,
    local: true,
    locked: false,
    nsfw: false,
    removed: false,
    deleted: false,
    published: POST_PUBLISHED_AT,
    ap_id: AP_ID,
    language_id: 37,
    featured_local: false,
    featured_community: false,
    url: variant === "youtube" ? YOUTUBE : undefined,
    thumbnail_url: variant === "image" ? IMAGE : undefined,
    url_content_type: variant == "image" ? "image/png" : undefined,
  },
  community: {
    ...COMMUNITY,
    slug: createCommunitySlug(COMMUNITY),
  },
  creator: {
    id: CREATOR_ID,
    name: "Jon Doe",
  },
  counts: {
    score: 231,
    comments: 37,
  },
  ...(variant === "image"
    ? {
        imageDetails: {
          ...IMAGE_DIMENSIONS,
        },
      }
    : {}),
});

function LoadPost({ variant }: { variant: "image" | "youtube" }) {
  const cachePost = usePostsStore((s) => s.cachePost);

  useEffect(() => {
    cachePost(createPost(variant));
  }, [variant]);

  return null;
}

//👇 This default export determines where your story goes in the story list
const meta: Meta<typeof PostCard> = {
  component: PostCard,
};

export default meta;
type Story = StoryObj<typeof PostCard>;

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
