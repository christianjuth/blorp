import { Feed } from "~/src/features/feed";
import { useParams, useNavigation } from "one";
import { useEffect } from "react";
import { useCommunity } from "~/src/lib/lemmy";

export default function Community() {
  const nav = useNavigation();

  const { communityId } = useParams<{ communityId: string }>();

  const community = useCommunity({
    id: communityId ? +communityId : undefined,
  });

  const communityTitle = community.data?.community_view.community.title;

  useEffect(() => {
    nav.setOptions({ title: communityTitle ?? "" });
  }, [communityTitle]);

  return <Feed communityId={communityId ? +communityId : undefined} />;
}
export async function generateStaticParams() {
  return [];
}
