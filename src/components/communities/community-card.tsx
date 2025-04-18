import { CommunityAggregates, CommunityView } from "lemmy-js-client";
import { abbriviateNumber } from "@/src/lib/format";
import { createSlug, Slug } from "@/src/lib/lemmy/utils";
import { useLinkContext } from "@/src/components/nav/link-context";
import { Link } from "react-router-dom";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { CommunityPartial } from "@/src/stores/create-post";
import { cn } from "@/src/lib/utils";
import { Skeleton } from "../ui/skeleton";

export function CommunityCard({
  communityView,
  disableLink,
  className,
  size = "md",
}: {
  communityView: CommunityView | CommunityPartial;
  disableLink?: boolean;
  className?: string;
  size?: "sm" | "md";
}) {
  let icon: string | undefined = undefined;
  let title: string;
  let slug: Slug | null;
  let counts: CommunityAggregates | undefined = undefined;

  if ("actor_id" in communityView) {
    icon = communityView.icon;
    title = communityView.title;
    slug = createSlug(communityView);
  } else {
    const { community } = communityView;
    counts = communityView.counts;
    icon = community.icon;
    title = community.title;
    slug = createSlug(community);
  }

  const linkCtx = useLinkContext();

  const content = (
    <>
      <Avatar className={cn("h-9 w-9", size === "sm" && "h-8 w-8")}>
        <AvatarImage src={icon} className="object-cover" />
        <AvatarFallback>{title.substring(0, 1)}</AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-0.5 flex-1 overflow-hidden">
        <span
          className={cn(
            "text-sm overflow-hidden overflow-ellipsis",
            size === "sm" && "text-xs",
          )}
        >
          {slug?.name}
          <span className="text-muted-foreground italic">@{slug?.host}</span>
        </span>
        {counts && (
          <span className="text-xs text-muted-foreground">
            {abbriviateNumber(counts.subscribers)} members
          </span>
        )}
      </div>
    </>
  );

  if (disableLink) {
    return (
      <div
        data-testid="community-card"
        className={cn(
          "flex flex-row gap-2 items-center flex-shrink-0 h-12",
          size === "sm" && "h-9",
          className,
        )}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      data-testid="community-card"
      to={`${linkCtx.root}c/${slug?.slug}`}
      className={cn(
        "flex flex-row gap-2 items-center flex-shrink-0 h-12 max-w-full",
        size === "sm" && "h-9",
        className,
      )}
    >
      {content}
    </Link>
  );
}

export function CommunityCardSkeleton({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div
      className={cn(
        "flex flex-row gap-2 items-center flex-shrink-0 h-12",
        className,
      )}
    >
      <Skeleton
        className={cn("h-9 w-9 rounded-full", size === "sm" && "h-8 w-8")}
      />

      <div className="flex flex-col gap-1">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-44" />
      </div>
    </div>
  );
}
