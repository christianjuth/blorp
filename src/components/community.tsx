import { CommunityView } from "lemmy-js-client";
import { abbriviateNumber } from "~/src/lib/format";
import { createCommunitySlug } from "../lib/lemmy/utils";
import { useLinkContext } from "./nav/link-context";
import { Link } from "react-router-dom";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/src/components/ui/avatar";

export function Community({ communityView }: { communityView: CommunityView }) {
  const { community, counts } = communityView;
  const slug = createCommunitySlug(community);

  const linkCtx = useLinkContext();

  return (
    <Link
      to={`${linkCtx.root}c/${slug}`}
      className="flex flex-row pt-3 gap-2 items-center flex-1"
    >
      <Avatar className="h-9 w-9">
        <AvatarImage src={community.icon} className="object-cover" />
        <AvatarFallback>{community.title.substring(0, 1)}</AvatarFallback>
      </Avatar>

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
