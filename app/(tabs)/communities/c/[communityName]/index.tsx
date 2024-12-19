import { Feed } from "~/src/features/community-feed";
import { useParams, useNavigation } from "one";
import { useEffect } from "react";
import { useCommunity } from "~/src/lib/lemmy";
import { useRecentCommunities } from "~/src/stores/recent-communities";

export default function Community() {
  const nav = useNavigation();

  const { communityName } = useParams<{ communityName: string }>();

  const community = useCommunity({
    name: communityName,
  });

  const updateRecent = useRecentCommunities((s) => s.update);

  useEffect(() => {
    if (community.data) {
      updateRecent(community.data.community_view.community);
    }
  }, [community.data]);

  const communityTitle = community.data?.community_view.community.title;

  useEffect(() => {
    nav.setOptions({ title: communityTitle ?? "" });
  }, [communityTitle]);

  return <Feed communityName={communityName} />;
}
export async function generateStaticParams() {
  return [];
}