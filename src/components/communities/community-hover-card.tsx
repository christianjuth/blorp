import { useCommunity } from "@/src/lib/lemmy/index";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { abbriviateNumber } from "@/src/lib/format";
import { useCommunitiesStore } from "@/src/stores/communities";
import { LuCakeSlice } from "react-icons/lu";
import { Skeleton } from "../ui/skeleton";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/src/components/ui/hover-card";
import { useState } from "react";
import { useAuth } from "@/src/stores/auth";
import { AggregateBadges } from "../aggregates";

dayjs.extend(localizedFormat);

export function CommunityHoverCard({
  communityName,
  children,
}: {
  communityName: string;
  children: React.ReactNode;
}) {
  const [enabled, setEnabled] = useState(false);
  useCommunity({
    name: communityName,
    enabled,
  });
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const data = useCommunitiesStore(
    (s) => s.communities[getCachePrefixer()(communityName)]?.data,
  );

  const communityView = data?.communityView;
  const community = communityView?.community;
  const counts = communityView?.counts;

  return (
    <HoverCard onOpenChange={() => setEnabled(true)}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        align="start"
        className="flex flex-col gap-3 py-4 flex-1"
      >
        <span className="font-semibold text-sm">{community?.title}</span>

        <div className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          <LuCakeSlice />
          <span>
            Created{" "}
            {community?.published && dayjs(community.published).format("ll")}
          </span>
        </div>

        {counts && (
          <AggregateBadges
            className="mt-1"
            aggregates={{
              Subscribers: counts.subscribers,
              Posts: counts.posts,
              Comments: counts.comments,
            }}
          />
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
