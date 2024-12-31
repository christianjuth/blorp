import { useParams } from "one";
import { Post } from "~/src/features/post";

export default function Page() {
  const { postId, communityName, commentPath } = useParams<{
    postId: string;
    communityName: string;
    commentPath: string;
  }>();

  return (
    <Post
      apId={postId}
      communityName={communityName}
      commentPath={commentPath}
    />
  );
}
export async function generateStaticParams() {
  return [];
}
