import { useParams } from "one";
import { CommunitySidebar } from "~/src/components/communities/community-sidebar";

export default function Page() {
  const { communityName } = useParams<{ communityName: string }>();
  return (
    communityName && <CommunitySidebar communityName={communityName} asPage />
  );
}

export async function generateStaticParams() {
  return [];
}
