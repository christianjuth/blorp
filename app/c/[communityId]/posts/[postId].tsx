import { useParams } from "one";
import { Post } from "~/src/features/post";

export default function Page() {
  const { postId } = useParams<{
    postId: string;
    communityId: string;
  }>();

  return <Post postId={postId} />;
}
export async function generateStaticParams() {
  return [];
}
