import { useLikeComment } from "@/src/lib/lemmy/index";
import { voteHaptics } from "@/src/lib/voting";
import { useRequireAuth } from "../auth-context";
import { ButtonHTMLAttributes, DetailedHTMLProps, useId } from "react";
import { cn } from "@/src/lib/utils";
import {
  PiArrowBendUpLeftBold,
  PiArrowFatUpBold,
  PiArrowFatDownBold,
  PiArrowFatDownFill,
  PiArrowFatUpFill,
} from "react-icons/pi";
import { FaHeart, FaRegHeart } from "react-icons/fa6";
import { Button } from "../ui/button";
import { abbriviateNumber } from "@/src/lib/format";
import { Schemas } from "@/src/lib/lemmy/adapters/api-blueprint";
import _ from "lodash";
import { getAccountSite, useAuth } from "@/src/stores/auth";

export function CommentVoting({
  commentView,
  className,
}: {
  commentView: Schemas.Comment;
  className?: string;
}) {
  const enableDownvotes =
    useAuth(
      (s) => getAccountSite(s.getSelectedAccount())?.enableCommentDownvotes,
    ) ?? true;

  const id = useId();

  const requireAuth = useRequireAuth();

  const vote = useLikeComment();

  const myVote = commentView?.optimisticMyVote ?? commentView?.myVote ?? 0;

  const isUpvoted = myVote > 0;
  const isDownvoted = myVote < 0;

  const diff = _.isNumber(commentView?.optimisticMyVote)
    ? commentView?.optimisticMyVote - (commentView?.myVote ?? 0)
    : 0;

  const score = commentView.upvotes - commentView.downvotes + diff;

  if (!enableDownvotes) {
    return (
      <Button
        size="sm"
        variant="ghost"
        onClick={async () => {
          const newVote = isUpvoted ? 0 : 1;
          voteHaptics(newVote);
          requireAuth().then(() => {
            vote.mutate({
              postId: commentView.postId,
              id: commentView.id,
              score: newVote,
              path: commentView.path,
            });
          });
        }}
        className={cn("text-md font-normal -mr-2", isUpvoted && "text-brand")}
      >
        {isUpvoted ? <FaHeart /> : <FaRegHeart />}
        {abbriviateNumber(score)}
      </Button>
    );
  }

  return (
    <div className={cn("flex flex-row items-center", className)}>
      <Button
        id={id}
        size="icon"
        variant="ghost"
        onClick={async () => {
          const newVote = isUpvoted ? 0 : 1;
          voteHaptics(newVote);
          requireAuth().then(() => {
            vote.mutate({
              postId: commentView.postId,
              id: commentView.id,
              score: newVote,
              path: commentView.path,
            });
          });
        }}
        //disabled={vote.isPending}
        className={cn(
          "hover:text-brand hover:bg-brand/10",
          isUpvoted && "text-brand",
          isDownvoted && "text-brand-secondary",
        )}
      >
        {isUpvoted ? <PiArrowFatUpFill /> : <PiArrowFatUpBold />}
      </Button>
      <label
        htmlFor={id}
        className={cn(
          "-mx-0.5 cursor-pointer",
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
            vote.mutate({
              postId: commentView.postId,
              id: commentView.id,
              score: newVote,
              path: commentView.path,
            });
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

export function CommentReplyButton(
  props: DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >,
) {
  return (
    <>
      <Button
        {...props}
        size="icon"
        variant="ghost"
        className={cn("md:hidden", props.className)}
      >
        <PiArrowBendUpLeftBold />
      </Button>
      <Button
        {...props}
        size="sm"
        variant="ghost"
        className={cn("max-md:hidden", props.className)}
      >
        <PiArrowBendUpLeftBold />
        <span>Reply</span>
      </Button>
    </>
  );
}
