import { PostsFeed } from "../components/posts/posts-feed";
import { usePosts } from "../lib/lemmy";
import { useSettings } from "../stores/settings";

export function Feed({ communityId }: { communityId?: number }) {
  const postSort = useSettings((s) => s.postSort);

  const posts = usePosts({
    limit: 50,
    sort: postSort,
    community_id: communityId,
  });

  return <PostsFeed posts={posts} />;
}
