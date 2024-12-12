import { useParams } from "one";
import { Post } from "~/src/features/post";

export default function Page() {
  const { postId, communityId } = useParams<{
    postId: string;
    communityId: string;
  }>();

  return <Post postId={postId} communityId={communityId} />;
}
export async function generateStaticParams() {
  return [];
}
