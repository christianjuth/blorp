import { useParams } from "one";
import { Sidebar } from "~/src/components/communities/community-sidebar";

export default function Page() {
  const { communityName } = useParams<{ communityName: string }>();
  return communityName && <Sidebar communityName={communityName} asPage />;
}

export async function generateStaticParams() {
  return [];
}
