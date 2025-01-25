import { ButtonProps } from "tamagui";
import { useFollowCommunity } from "~/src/lib/lemmy";
import { useAuth } from "~/src/stores/auth";
import { useCommunitiesStore } from "~/src/stores/communities";
import { Button } from "~/src/components/ui/button";

interface Props extends ButtonProps {
  communityName: string | undefined;
}

export function CommunityJoinButton({ communityName, ...props }: Props) {
  const isLoggedIn = useAuth((s) => s.isLoggedIn());
  const follow = useFollowCommunity();

  const cache = useCommunitiesStore((s) =>
    communityName ? s.communities[communityName] : null,
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
      bg="$accentColor"
      br="$12"
      fontWeight="bold"
      size="$3"
      {...props}
      onPress={() => {
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
