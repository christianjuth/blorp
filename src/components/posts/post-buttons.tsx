import { useLikePost } from "@/src/lib/lemmy/index";
import { voteHaptics } from "@/src/lib/voting";
import { useRequireAuth } from "../auth-context";

import { Link, LinkProps } from "@/src/components/nav/index";

import {
  PiArrowFatUpBold,
  PiArrowFatDownBold,
  PiArrowFatDownFill,
  PiArrowFatUpFill,
} from "react-icons/pi";
import { TbMessageCircle } from "react-icons/tb";
import { cn } from "@/src/lib/utils";
import { Button } from "../ui/button";
import { useId } from "react";
import { abbriviateNumber } from "@/src/lib/format";

export function Voting({
  apId,
  myVote,
  score,
}: {
  apId: string;
  myVote: number;
  score: number;
}) {
  const id = useId();
  const requireAuth = useRequireAuth();

  const vote = useLikePost(apId);

  const isUpvoted = myVote > 0;
  const isDownvoted = myVote < 0;

  return (
    <div className="flex flex-row items-center h-7">
      <Button
        id={id}
        size="icon"
        variant="ghost"
        onClick={async () => {
          const newVote = isUpvoted ? 0 : 1;
          voteHaptics(newVote);
          requireAuth().then(() => {
            vote.mutate(newVote);
          });
        }}
        //disabled={vote.isPending}
        className={cn(
          "hover:text-brand hover:bg-brand/10",
          "pl-2 pr-1.5 flex items-center space-x-1 text-left",
          isUpvoted && "text-brand",
        )}
      >
        {isUpvoted ? <PiArrowFatUpFill /> : <PiArrowFatUpBold />}
      </Button>
      <label
        htmlFor={id}
        className={cn(
          "-mx-0.5 cursor-pointer text-md",
          isUpvoted && "text-brand",
          isDownvoted && "text-brand-secondary",
        )}
      >
        {abbriviateNumber(score)}
      </label>
      <Button
        size="icon"
        variant="ghost"
        onClick={async () => {
          const newVote = isDownvoted ? 0 : -1;
          voteHaptics(newVote);
          requireAuth().then(() => {
            vote.mutate(newVote);
          });
        }}
        //disabled={vote.isPending}
        className={cn(
          "hover:text-brand-secondary hover:bg-brand-secondary/10",
          isDownvoted && "text-brand-secondary",
        )}
      >
        {isDownvoted ? <PiArrowFatDownFill /> : <PiArrowFatDownBold />}
      </Button>
    </div>
  );
}

export function PostCommentsButton({
  commentsCount,
  href,
  onClick,
}: {
  commentsCount: number;
  href?: LinkProps["to"];
  onClick?: () => void;
}) {
  if (href) {
    return (
      <Button size="sm" variant="ghost" className="text-md font-normal" asChild>
        <Link to={href}>
          <TbMessageCircle className="scale-115" />
          <span>{abbriviateNumber(commentsCount)}</span>
        </Link>
      </Button>
    );
  }
  if (onClick) {
    return (
      <Button
        size="sm"
        variant="ghost"
        onClick={onClick}
        className="text-md font-normal"
      >
        <TbMessageCircle className="scale-115" />
        {commentsCount}
      </Button>
    );
  }
  return null;
}
