import { useParams } from "one";
import { Sidebar } from "~/src/components/communities/community-sidebar";
import { ContentGutters } from "~/src/components/gutters";

export default function Page() {
  const { communityName } = useParams<{ communityName: string }>();
  return (
    communityName && (
      <ContentGutters>
        <Sidebar communityName={communityName} />
      </ContentGutters>
    )
  );
}

export async function generateStaticParams() {
  return [];
}
