import { useParams } from "one";
import { Post } from "~/src/features/post";
import { useIsScreenReady } from "~/src/lib/navigation";

export default function Page() {
  const { postId, communityName } = useParams<{
    postId: string;
    communityName: string;
  }>();

  const isReady = useIsScreenReady();

  return <Post apId={postId} communityName={communityName} isReady={isReady} />;
}
