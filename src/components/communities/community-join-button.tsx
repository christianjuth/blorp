import { Button } from "../ui/button";
import { useFollowCommunity } from "@/src/lib/lemmy/index";
import { useAuth } from "@/src/stores/auth";
import { useCommunitiesStore } from "@/src/stores/communities";

interface Props {
  communityName: string | undefined;
  className?: string;
}

export function CommunityJoinButton({ communityName, ...props }: Props) {
  const isLoggedIn = useAuth((s) => s.isLoggedIn());
  const follow = useFollowCommunity();

  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const cache = useCommunitiesStore((s) =>
    communityName ? s.communities[getCachePrefixer()(communityName)] : null,
  );

  const data = cache?.data;
  const subscribed =
    data?.optimisticSubscribed ?? data?.communityView.subscribed;

  let copy = "Join";
  if (subscribed === "Pending") {
    copy = "Pending";
  } else if (subscribed === "Subscribed") {
    copy = "Leave";
  }

  const communityView = cache?.data.communityView;

  if (!isLoggedIn) {
    return null;
  }

  return (
    <Button
      size="sm"
      {...props}
      onClick={() => {
        if (communityView) {
          follow.mutate({
            community: communityView.community,
            follow: subscribed === "NotSubscribed" ? true : false,
          });
        }
      }}
    >
      {copy}
    </Button>
  );
}
