import { useParams, useNavigation } from "one";
import { PostComments } from "~/src/components/posts/post-comment";
import { useEffect } from "react";
import { usePost, usePostComments } from "~/src/lib/lemmy";
import { PostDetail } from "~/src/components/posts/post-details";

const EMPTY_ARR = [];

export default function Post() {
  const nav = useNavigation();

  const { postId, communityId } = useParams<{
    postId: string;
    communityId: string;
  }>();

  const { data } = usePost({
    id: postId ? parseInt(postId) : undefined,
    comment_id: communityId ? +communityId : undefined,
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

  return (
    <PostComments
      commentViews={allComments}
      header={postView ? <PostDetail postView={postView} /> : null}
      loadMore={() => {
        if (comments.hasNextPage && !comments.isFetchingNextPage) {
          comments.fetchNextPage();
        }
      }}
      opId={postView?.creator.id}
    />
  );
}
export async function generateStaticParams() {
  return [];
}
