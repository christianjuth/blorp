import { PostsFeed } from "../components/posts/posts-feed";
import { usePosts } from "../lib/lemmy";
import { useSorts } from "../stores/sorts";

export function Feed({ communityName }: { communityName?: string }) {
  const postSort = useSorts((s) => s.postSort);

  const posts = usePosts({
    limit: 50,
    sort: postSort,
    community_name: communityName,
  });

  return <PostsFeed posts={posts} />;
}
