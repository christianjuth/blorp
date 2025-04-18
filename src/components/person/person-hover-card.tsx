import { useCommunity, usePersonDetails } from "@/src/lib/lemmy/index";
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
import { PersonView } from "lemmy-js-client";
import { useProfilesStore } from "@/src/stores/profiles";
import { useAuth } from "@/src/stores/auth";

dayjs.extend(localizedFormat);

export function PersonHoverCard({
  actorId,
  children,
}: {
  actorId: string;
  children: React.ReactNode;
}) {
  const [enabled, setEnabled] = useState(false);

  usePersonDetails({ actorId, enabled });
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const personView = useProfilesStore((s) =>
    actorId ? s.profiles[getCachePrefixer()(actorId)]?.data : undefined,
  );
  const counts = personView?.counts;

  return (
    <HoverCard onOpenChange={() => setEnabled(true)}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        align="start"
        className="flex flex-col gap-3 py-4 flex-1"
      >
        <div className="font-bold text-sm h-5">
          {personView?.person.display_name ?? personView?.person.name ?? (
            <Skeleton className="w-2/3 h-full" />
          )}
        </div>

        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <LuCakeSlice />
          <span>
            Created{" "}
            {personView && dayjs(personView.person.published).format("ll")}
          </span>
        </div>

        <div className="grid grid-cols-2 grid-flow-dense text-sm">
          <span className="font-semibold col-start-1 h-5">
            {counts ? (
              abbriviateNumber(counts.post_count)
            ) : (
              <Skeleton className="w-1/4 h-full" />
            )}
          </span>
          <span className="col-start-1 text-sm text-muted-foreground">
            Posts
          </span>

          <span className="font-semibold col-start-2 h-5">
            {counts ? (
              abbriviateNumber(counts.comment_count)
            ) : (
              <Skeleton className="w-1/4 h-full" />
            )}
          </span>
          <span className="col-start-2 text-sm text-muted-foreground">
            Comments
          </span>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
