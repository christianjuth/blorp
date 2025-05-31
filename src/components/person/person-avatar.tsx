import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { cn } from "@/src/lib/utils";
import { useAuth } from "@/src/stores/auth";
import { useProfilesStore } from "@/src/stores/profiles";
import { usePersonDetails } from "@/src/lib/lemmy";
import { Person } from "lemmy-v3";

export function PersonAvatar({
  actorId,
  size = "md",
  className,
  person: override,
}: {
  actorId: string;
  person?: Person;
  size?: "sm" | "md";
  className?: string;
}) {
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const personView = useProfilesStore((s) =>
    actorId ? s.profiles[getCachePrefixer()(actorId)]?.data : undefined,
  );
  usePersonDetails({
    actorId,
    enabled: !personView,
  });

  return (
    <Avatar className={cn("h-9 w-9", size === "sm" && "h-8 w-8", className)}>
      <AvatarImage
        src={override ? override.avatar : personView?.person.avatar}
        className="object-cover"
      />
      <AvatarFallback>
        {(override?.name ?? personView?.person.name)?.substring(0, 1)}
      </AvatarFallback>
    </Avatar>
  );
}
