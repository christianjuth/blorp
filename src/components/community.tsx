import { CommunityAggregates, CommunityView } from "lemmy-js-client";
import { abbriviateNumber } from "~/src/lib/format";
import { createCommunitySlug } from "../lib/lemmy/utils";
import { useLinkContext } from "./nav/link-context";
import { Link } from "react-router-dom";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/src/components/ui/avatar";
import { CommunityPartial } from "../stores/create-post";
import { cn } from "../lib/utils";

export function Community({
  communityView,
  disableLink,
  className,
}: {
  communityView: CommunityView | CommunityPartial;
  disableLink?: boolean;
  className?: string;
}) {
  let icon: string | undefined = undefined;
  let title: string;
  let slug: string;
  let name: string;
  let counts: CommunityAggregates | undefined = undefined;

  if ("actor_id" in communityView) {
    icon = communityView.icon;
    title = communityView.title;
    slug = createCommunitySlug(communityView);
    name = communityView.name;
  } else {
    const { community } = communityView;
    counts = communityView.counts;
    icon = community.icon;
    title = community.title;
    slug = createCommunitySlug(community);
    name = community.name;
  }

  const linkCtx = useLinkContext();

  const [slugName, slugHost] = slug.split("@");

  const content = (
    <>
      <Avatar className="h-9 w-9">
        <AvatarImage src={icon} className="object-cover" />
        <AvatarFallback>{title.substring(0, 1)}</AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-0.5">
        <span className="text-sm">
          {slugName}
          <span className="text-muted-foreground italic">@{slugHost}</span>
        </span>
        {counts && (
          <span className="text-xs text-zinc-500">
            {abbriviateNumber(counts.subscribers)} members •{" "}
            {abbriviateNumber(counts.posts)} posts
          </span>
        )}
      </div>
    </>
  );

  if (disableLink) {
    return (
      <div className={cn("flex flex-row gap-2 items-center flex-1", className)}>
        {content}
      </div>
    );
  }

  return (
    <Link
      to={`${linkCtx.root}c/${slug}`}
      className={cn("flex flex-row gap-2 items-center flex-1", className)}
    >
      {content}
    </Link>
  );
}
