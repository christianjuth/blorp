import { PostsFeed } from "../components/posts/posts-feed";
import { usePosts } from "../lib/lemmy";
import { useFiltersStore } from "../stores/filters";

export function Feed() {
  const postSort = useFiltersStore((s) => s.postSort);
  const homeFilter = useFiltersStore((s) => s.homeFilter);

  const posts = usePosts({
    limit: 50,
    sort: postSort,
    type_: homeFilter,
  });

  return <PostsFeed posts={posts} />;
}
