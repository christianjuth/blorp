import { useParams } from "one";
import { SearchFeed } from "~/src/features/search";

export default function Page() {
  const { search } = useParams<{ search: string }>();
  return <SearchFeed search={search} defaultType="communities" />;
}

export async function generateStaticParams() {
  return [];
}
