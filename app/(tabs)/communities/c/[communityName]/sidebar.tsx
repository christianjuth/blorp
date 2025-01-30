import { useParams } from "one";
import { CommunitySidebar } from "~/src/components/communities/community-sidebar";
import { useCommunity } from "~/src/lib/lemmy";

export default function Page() {
  const { communityName } = useParams<{ communityName: string }>();
  useCommunity({
    name: communityName,
  });
  return (
    communityName && <CommunitySidebar communityName={communityName} asPage />
  );
}

export async function generateStaticParams() {
  return [];
}
