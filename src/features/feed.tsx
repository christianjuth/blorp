import { PostsFeed } from "../components/posts/posts-feed";
import { usePosts } from "../lib/lemmy";
import { useSorts } from "../stores/sorts";

export function Feed({ communityId }: { communityId?: number }) {
  const postSort = useSorts((s) => s.postSort);

  const posts = usePosts({
    limit: 50,
    sort: postSort,
    community_id: communityId,
  });

  return <PostsFeed posts={posts} />;
}
