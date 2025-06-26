import dayjs from "dayjs";
import {
  ImageDetails,
  Person,
  Post,
  PostAggregates,
  PostView,
} from "lemmy-js-client";
import _ from "lodash";

export type Slug = {
  name: string;
  host: string;
  slug: string;
};

export function createSlug(
  object:
    | { actor_id: string; name?: string }
    | { ap_id: string; name?: string }
    | { apId: string; name?: string },
  throwOnError: true,
): Slug;
export function createSlug(
  object:
    | { actor_id: string; name?: string }
    | { ap_id: string; name?: string }
    | { apId: string; name?: string },
  throwOnError?: false,
): Slug | null;
export function createSlug(
  object:
    | { actor_id: string; name?: string }
    | { ap_id: string; name?: string }
    | { apId: string; name?: string },
  throwOnError = false,
): Slug | null {
  try {
    const apId =
      "actor_id" in object
        ? object.actor_id
        : "ap_id" in object
          ? object.ap_id
          : object.apId;

    const url = new URL(apId);
    const path = url.pathname.split("/");
    const name = object.name ?? path[2] ?? path[1]?.replace(/^@/, "");
    if (!name) {
      if (throwOnError) {
        throw new Error("invalid url for slug, apId=" + apId);
      }
      return null;
    }
    const host = url.host;
    return {
      name,
      host,
      slug: `${name}@${host}`,
    } satisfies Slug;
  } catch (err) {
    if (throwOnError) {
      throw err;
    }
    return null;
  }
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

export function flattenPost({
  post_view: postView,
  cross_posts: crossPosts,
}: {
  post_view: PostView;
  cross_posts?: Array<PostView>;
}): FlattenedPost {
  const community = postView.community;
  const post = postView.post;
  return {
    myVote: postView.my_vote,
    post,
    crossPosts: crossPosts?.map((post_view) =>
      flattenPost({
        post_view,
      }),
    ),
    community: {
      name: community.name,
      title: community.title,
      icon: community.icon,
      slug: createSlug(postView.community, true).slug,
      actorId: postView.community.actor_id,
    },
    creator: _.pick(postView.creator, ["id", "name", "avatar", "actor_id"]),
    counts: _.pick(postView.counts, ["score", "comments"]),
    imageDetails: postView.image_details
      ? _.pick(postView.image_details, ["width", "height"])
      : undefined,
    saved: postView.saved,
    read: postView.read,
  };
}

export function encodeApId(id: string) {
  return encodeURIComponent(id);
}

export function decodeApId(encodedUrl: string) {
  return decodeURIComponent(encodedUrl);
}

export const lemmyTimestamp = () => new Date().toISOString();
