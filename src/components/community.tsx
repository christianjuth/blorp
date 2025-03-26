import { CommunityView } from "lemmy-js-client";
import { abbriviateNumber } from "~/src/lib/format";
import { createCommunitySlug } from "../lib/lemmy/utils";
import { useLinkContext } from "./nav/link-context";
import { Link } from "react-router-dom";

export function Community({ communityView }: { communityView: CommunityView }) {
  const { community, counts } = communityView;
  const slug = createCommunitySlug(community);

  const linkCtx = useLinkContext();

  return (
    <Link
      to={`${linkCtx.root}c/${slug}`}
      className="flex flex-row py-2 gap-2 items-center"
    >
      <div className="h-9 w-9 bg-zinc-300 dark:bg-zinc-700 flex items-center rounded-full">
        <span className="text-center mx-auto">
          {community.title.substring(0, 1)}
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-sm">c/{community.name}</span>
        <span className="text-xs text-zinc-500">
          {abbriviateNumber(counts.subscribers)} members •{" "}
          {abbriviateNumber(counts.posts)} posts
        </span>
      </div>
    </Link>
  );
}
