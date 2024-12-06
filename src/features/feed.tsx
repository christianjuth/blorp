import { PostsFeed } from "../components/posts/posts-feed2";
import { usePosts } from "../lib/lemmy";

export function Feed() {
  const posts = usePosts({
    limit: 50,
    sort: "Active",
  });

  return <PostsFeed posts={posts} />;
}
