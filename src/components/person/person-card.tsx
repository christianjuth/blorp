import { Link } from "react-router-dom";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { cn } from "@/src/lib/utils";
import { Skeleton } from "../ui/skeleton";
import { useAuth } from "@/src/stores/auth";
import { useProfilesStore } from "@/src/stores/profiles";
import { createSlug, encodeApId } from "@/src/lib/lemmy/utils";
import { useLinkContext } from "../nav/link-context";

export function PersonCard({
  actorId,
  size = "md",
  className,
}: {
  actorId: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const linkCtx = useLinkContext();
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const personView = useProfilesStore((s) =>
    actorId ? s.profiles[getCachePrefixer()(actorId)]?.data : undefined,
  );
  const slug = personView ? createSlug(personView.person) : null;

  if (!personView) {
    return null;
  }

  const content = (
    <>
      <Avatar className={cn("h-9 w-9", size === "sm" && "h-8 w-8")}>
        <AvatarImage src={personView?.person.avatar} className="object-cover" />
        <AvatarFallback>
          {personView?.person.name.substring(0, 1)}
        </AvatarFallback>
      </Avatar>

      <span
        className={cn(
          "text-sm overflow-hidden overflow-ellipsis",
          size === "sm" && "text-xs",
        )}
      >
        {personView?.person?.name}
        <span className="text-muted-foreground italic">@{slug?.host}</span>
      </span>
    </>
  );

  return (
    <Link
      data-testid="person-card"
      to={`${linkCtx.root}u/${encodeApId(personView?.person.actor_id)}`}
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
