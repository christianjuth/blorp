import { useParams } from "one";
import { PostsFeed } from "~/src/components/posts/posts-feed";
import { useSearch } from "~/src/lib/lemmy";
import { useFiltersStore } from "~/src/stores/filters";

export function Feed() {
  const postSort = useFiltersStore((s) => s.postSort);

  const { search, communityName } = useParams<{
    search: string;
    communityName: string;
  }>();

  const posts = useSearch({
    type_: "Posts",
    q: search ?? "",
    community_name: communityName,
    sort: postSort,
  });

  return <PostsFeed posts={posts} />;
}
