import dayjs from "dayjs";
import { ImageDetails, Person, Post, PostAggregates, PostView } from "lemmy-v3";
import _ from "lodash";

export type Slug = {
  name: string;
  host: string;
  slug: string;
};

export function createSlug({
  apId,
  name,
}: {
  apId: string;
  name: string;
}): Slug {
  const url = new URL(apId);
  if (!name) {
    throw new Error("invalid url for slug, apId=" + apId);
  }
  const host = url.host;
  return {
    name,
    host,
    slug: `${name}@${host}`,
  } satisfies Slug;
}

export type FlattenedPost = {
  optimisticMyVote?: number;
  myVote?: number;
  optimisticSaved?: boolean;
  saved: boolean;
  optimisticDeleted?: boolean;
  read: boolean;
  optimisticRead?: boolean;
  post: Post;
  optimisticFeaturedCommunity?: boolean;
  optimisticFeaturedLocal?: boolean;
  community: {
    name: string;
    title: string;
    icon?: string;
    slug: string;
    actorId: string;
  };
  creator: Pick<Person, "id" | "name" | "avatar" | "actor_id">;
  counts: Pick<PostAggregates, "score" | "comments">;
  imageDetails?: Pick<ImageDetails, "height" | "width">;
  crossPosts?: Array<Omit<FlattenedPost, "crossPosts">>;
};
export type FlattenedGetPostResponse = {
  posts: FlattenedPost[];
};

export function encodeApId(id: string) {
  return encodeURIComponent(id);
}

export function decodeApId(encodedUrl: string) {
  return decodeURIComponent(encodedUrl);
}

export const lemmyTimestamp = () => new Date().toISOString();
