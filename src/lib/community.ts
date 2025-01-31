import { Community } from "lemmy-js-client";

export function createCommunitySlug(community: Pick<Community, "actor_id">) {
  const url = new URL(community.actor_id);
  const path = url.pathname.split("/");
  if (!path[2]) {
    // TODO: make this more strict
    return "";
  }
  return `${path[2]}@${url.host}`;
}
