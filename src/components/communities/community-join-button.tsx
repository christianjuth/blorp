import { Deferred } from "@/src/lib/deferred";
import { Button } from "../ui/button";
import { useFollowCommunity } from "@/src/lib/lemmy/index";
import { useAuth } from "@/src/stores/auth";
import { useCommunitiesStore } from "@/src/stores/communities";
import { useIonAlert } from "@ionic/react";

interface Props {
  communityName: string | undefined;
  className?: string;
}

export function CommunityJoinButton({ communityName, ...props }: Props) {
  const [alrt] = useIonAlert();

  const isLoggedIn = useAuth((s) => s.isLoggedIn());
  const follow = useFollowCommunity();

  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const cache = useCommunitiesStore((s) =>
    communityName ? s.communities[getCachePrefixer()(communityName)] : null,
  );

  const data = cache?.data;
  const subscribed =
    data?.communityView.optimisticSubscribed ?? data?.communityView.subscribed;

  let copy = "Join";
  if (subscribed === "Pending") {
    copy = "Pending";
  } else if (subscribed === "Subscribed") {
    copy = "Joined";
  }

  const communityView = cache?.data.communityView;

  if (!isLoggedIn) {
    return null;
  }

  return (
    <Button
      size="sm"
      variant={subscribed === "NotSubscribed" ? "default" : "outline"}
      {...props}
      onClick={async () => {
        if (communityView) {
          const shouldFollow = subscribed === "NotSubscribed";

          if (!shouldFollow) {
            const deferred = new Deferred();
            alrt({
              message: `Are you sure you want to leave ${communityName}`,
              buttons: [
                {
                  text: "Cancel",
                  role: "cancel",
                  handler: () => deferred.reject(),
                },
                {
                  text: "Leave",
                  role: "destructive",
                  handler: () => deferred.resolve(),
                },
              ],
            });
            await deferred.promise;
          }

          follow.mutate({
            community: communityView,
            follow: shouldFollow ? true : false,
          });
        }
      }}
    >
      {copy}
    </Button>
  );
}
