import { Community } from "lemmy-js-client";
import { Link } from "react-router-dom";
import { createCommunitySlug } from "@/src/lib/lemmy/utils";

export function SmallCommunityCard({
  disableLink = false,
  community,
}: {
  disableLink?: boolean;
  community: Pick<Community, "icon" | "title" | "name" | "id" | "actor_id">;
}) {
  const slug = createCommunitySlug(community);

  const content = (
    <div className="flex flex-row gap-2.5 items-center">
      <img src={community.icon} className="h-8 w-8 rounded-full object-cover" />
      <span className="text-sm">c/{community.name}</span>
    </div>
  );

  return disableLink ? (
    content
  ) : (
    <Link to={`/home/c/${slug}`} key={community.id}>
      {content}
    </Link>
  );
}
