import {
  Community,
  ImageDetails,
  Person,
  Post,
  PostAggregates,
  PostView,
} from "lemmy-js-client";
import _ from "lodash";

export function createCommunitySlug(community: Pick<Community, "actor_id">) {
  const url = new URL(community.actor_id);
  const path = url.pathname.split("/");
  if (!path[2]) {
    // TODO: make this more strict
    return "";
  }
  return `${path[2]}@${url.host}`;
}

export function parseCommunitySlug(slug: string) {
  const [communityName, lemmyServer] = slug.split("@");
  return {
    communityName,
    lemmyServer,
  };
}

export type FlattenedPost = {
  optimisticMyVote?: number;
  myVote?: number;
  post: Post;
  community: {
    name: string;
    title: string;
    icon?: string;
    slug: string;
  };
  creator: Pick<Person, "id" | "name" | "avatar">;
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
  const creator = postView.creator;
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
      slug: createCommunitySlug(postView.community),
    },
    creator: {
      id: creator.id,
      name: creator.name,
      avatar: creator.avatar,
    },
    counts: _.pick(postView.counts, ["score", "comments"]),
    imageDetails: postView.image_details
      ? _.pick(postView.image_details, ["width", "height"])
      : undefined,
  };
}
