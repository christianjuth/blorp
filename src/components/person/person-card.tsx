import { Link } from "@/src/routing/index";
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
import { useLinkContext } from "../../routing/link-context";
import { usePersonDetails } from "@/src/lib/lemmy";
import { Person } from "lemmy-js-client";

export function PersonCard({
  actorId,
  size = "md",
  className,
  person: override,
  disableLink,
}: {
  actorId: string;
  person?: Person;
  size?: "sm" | "md";
  className?: string;
  disableLink?: boolean;
}) {
  const linkCtx = useLinkContext();
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const personView = useProfilesStore((s) =>
    actorId ? s.profiles[getCachePrefixer()(actorId)]?.data : undefined,
  );
  usePersonDetails({
    actorId,
    enabled: !personView,
  });
  const p = override ?? personView?.person;
  const slug = p ? createSlug(p) : null;

  if (!personView && !override) {
    return <PersonSkeletonCard size={size} className={className} />;
  }

  const content = (
    <>
      <Avatar className={cn("h-9 w-9", size === "sm" && "h-8 w-8")}>
        <AvatarImage
          src={override ? override.avatar : personView?.person.avatar}
          className="object-cover"
        />
        <AvatarFallback>
          {(override?.name ?? personView?.person.name)?.substring(0, 1)}
        </AvatarFallback>
      </Avatar>

      <span
        className={cn(
          "text-sm overflow-hidden overflow-ellipsis",
          size === "sm" && "text-xs",
        )}
      >
        {override?.name ?? personView?.person?.name}
        <span className="text-muted-foreground italic">@{slug?.host}</span>
      </span>
    </>
  );

  if (disableLink) {
    return (
      <div
        data-testid="person-card"
        className={cn(
          "flex flex-row gap-2 items-center flex-shrink-0 h-12 max-w-full text-foreground",
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
      data-testid="person-card"
      to={`${linkCtx.root}u/:userId`}
      params={{
        userId: encodeApId(override ? override.actor_id : actorId),
      }}
      className={cn(
        "flex flex-row gap-2 items-center flex-shrink-0 h-12 max-w-full text-foreground",
        size === "sm" && "h-9",
        className,
      )}
    >
      {content}
    </Link>
  );
}

export function PersonSkeletonCard({
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
      </div>
    </div>
  );
}
