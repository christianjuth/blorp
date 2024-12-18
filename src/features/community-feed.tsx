import { PostsFeed } from "../components/posts/posts-feed";
import { usePosts } from "../lib/lemmy";
import { useFiltersStore } from "../stores/filters";

export function Feed({ communityName }: { communityName?: string }) {
  const postSort = useFiltersStore((s) => s.postSort);

  const posts = usePosts({
    limit: 50,
    sort: postSort,
    community_name: communityName,
  });

  return <PostsFeed posts={posts} />;
}
