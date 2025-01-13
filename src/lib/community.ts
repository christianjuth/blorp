import { Community } from "lemmy-js-client";

function getLemmyServer({ actor_id }: { actor_id: string }) {
  const server = new URL(actor_id);
  return server.host;
}

export function createCommunitySlug(
  community: Pick<Community, "actor_id" | "name">,
) {
  const server = getLemmyServer(community);
  return `${community.name}@${server}`;
}
