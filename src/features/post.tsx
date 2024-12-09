import { useNavigation } from "one";
import { PostComments } from "~/src/components/posts/post-comment";
import { useEffect } from "react";
import { usePost, usePostComments } from "~/src/lib/lemmy";
import { PostDetail } from "~/src/components/posts/post-details";
import {
  Sidebar,
  COMMUNITY_SIDEBAR_WIDTH,
} from "~/src/components/communities/community-sidebar";
import { FeedGutters } from "../components/feed-gutters";

const EMPTY_ARR = [];

export function Post({ postId }: { postId?: string }) {
  const nav = useNavigation();

  const { data } = usePost({
    id: postId ? parseInt(postId) : undefined,
  });

  const comments = usePostComments({
    post_id: postId ? parseInt(postId) : undefined,
    limit: 50,
    type_: "All",
    max_depth: 6,
    saved_only: false,
  });

  const postView = data?.post_view;

  const communityTitle = postView?.community.title;

  useEffect(() => {
    nav.setOptions({ title: communityTitle ?? "" });
  }, [communityTitle]);

  const allComments = comments.data
    ? comments.data.pages.map((p) => p.comments).flat()
    : EMPTY_ARR;

  if (!postView) {
    return null;
  }

  return (
    <PostComments
      commentViews={allComments}
      header={
        <FeedGutters>
          <PostDetail postView={postView} />
          <Sidebar />
        </FeedGutters>
      }
      loadMore={() => {
        if (comments.hasNextPage && !comments.isFetchingNextPage) {
          comments.fetchNextPage();
        }
      }}
      opId={postView?.creator.id}
    />
  );
}
