import { useParams } from "one";
import { Post } from "~/src/features/post";
import { useIsScreenReady } from "~/src/lib/navigation";

export default function Page() {
  const { postId, communityName, commentPath } = useParams<{
    postId: string;
    communityName: string;
    commentPath: string;
  }>();

  const isReady = useIsScreenReady();

  return (
    <Post
      apId={postId}
      communityName={communityName}
      commentPath={commentPath}
      isReady={isReady}
    />
  );
}
