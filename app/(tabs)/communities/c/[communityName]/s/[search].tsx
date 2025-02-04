import { useParams } from "one";
import { SearchFeed } from "~/src/features/search";

export function Feed() {
  const { search, communityName } = useParams<{
    search: string;
    communityName: string;
  }>();

  return <SearchFeed search={search} communityName={communityName} />;
}
