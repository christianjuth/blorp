import { useParams, useNavigation } from "one";
import { useEffect } from "react";
import { useCommunity } from "~/src/lib/lemmy/index";
import { useRecentCommunitiesStore } from "~/src/stores/recent-communities";
import { CommunityFeed } from "~/src/features/community-feed";

export default function Community() {
  const nav = useNavigation();

  const { communityName } = useParams<{ communityName: string }>();

  const community = useCommunity({
    name: communityName,
  });

  const updateRecent = useRecentCommunitiesStore((s) => s.update);

  useEffect(() => {
    if (community.data) {
      updateRecent(community.data.community_view.community);
    }
  }, [community.data]);

  const communityTitle = community.data?.community_view.community.title;

  useEffect(() => {
    nav.setOptions({ title: communityTitle ?? "" });
  }, [communityTitle]);

  return <CommunityFeed communityName={communityName} />;
}
