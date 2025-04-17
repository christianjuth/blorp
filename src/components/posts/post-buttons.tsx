import { useLikePost } from "@/src/lib/lemmy/index";
import { voteHaptics } from "@/src/lib/voting";
import { useRequireAuth } from "../auth-context";

import { Link } from "react-router-dom";

import {
  PiArrowFatUpBold,
  PiArrowFatDownBold,
  PiArrowFatDownFill,
  PiArrowFatUpFill,
  PiArrowBendUpLeftBold,
} from "react-icons/pi";
import { TbMessageCircle } from "react-icons/tb";
import { cn } from "@/src/lib/utils";
import { ButtonHTMLAttributes, DetailedHTMLProps } from "react";

export function Voting({
  apId,
  myVote,
  score,
}: {
  apId: string;
  myVote: number;
  score: number;
}) {
  const requireAuth = useRequireAuth();

  const vote = useLikePost(apId);

  const isUpvoted = myVote > 0;
  const isDownvoted = myVote < 0;

  return (
    <div className="flex flex-row border-[0.5px] rounded-full items-center h-7">
      <button
        onClick={async () => {
          const newVote = isUpvoted ? 0 : 1;
          voteHaptics(newVote);
          requireAuth().then(() => {
            vote.mutate(newVote);
          });
        }}
        disabled={vote.isPending}
        className={cn(
          "pl-2 pr-1.5 flex items-center space-x-1 text-left",
          isUpvoted && "text-brand",
        )}
      >
        <>
          {isUpvoted ? <PiArrowFatUpFill /> : <PiArrowFatUpBold />}
          <span>{score}</span>
        </>
      </button>
      <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 mr-1" />
      <button
        onClick={async () => {
          const newVote = isDownvoted ? 0 : -1;
          voteHaptics(newVote);
          requireAuth().then(() => {
            vote.mutate(newVote);
          });
        }}
        disabled={vote.isPending}
        className={cn(
          "pr-2 flex items-center",
          isDownvoted && "text-destructive",
        )}
      >
        {isDownvoted ? <PiArrowFatDownFill /> : <PiArrowFatDownBold />}
      </button>
    </div>
  );
}

export function PostReplyButton(
  props: DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >,
) {
  return (
    <button
      {...props}
      className={cn(
        "flex flex-row items-center gap-1 text-muted-foreground text-sm",
        props.className,
      )}
    >
      <PiArrowBendUpLeftBold />
      <span>Reply</span>
    </button>
  );
}

export function PostCommentsButton({
  commentsCount,
  href,
  onClick,
}: {
  commentsCount: number;
  href?: string;
  onClick?: () => void;
}) {
  if (href) {
    return (
      <Link
        to={href}
        className="h-7 flex items-center gap-1 border-[0.5px] px-2.5 rounded-full"
      >
        <TbMessageCircle className="text-lg" />
        <span>{commentsCount}</span>
      </Link>
    );
  }
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="h-7 flex items-center gap-1 border-[0.5px] px-2.5 rounded-full"
      >
        <TbMessageCircle className="text-lg" />
        <span>{commentsCount}</span>
      </button>
    );
  }
  return null;
}
