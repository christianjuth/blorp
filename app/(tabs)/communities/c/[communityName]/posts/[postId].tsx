import { useParams } from "one";
import { Post } from "~/src/features/post";

export default function Page() {
  const { postId, communityName } = useParams<{
    postId: string;
    communityName: string;
  }>();

  return <Post postId={postId} communityName={communityName} />;
}
export async function generateStaticParams() {
  return [];
}
