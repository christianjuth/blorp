import { FlattenedComment, useLikeComment } from "@/src/lib/lemmy/index";
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
import { Button } from "../ui/button";
import { abbriviateNumber } from "@/src/lib/format";
import { useMedia } from "@/src/lib/hooks";

export function CommentVoting({
  commentView,
}: {
  commentView: FlattenedComment;
}) {
  const id = useId();

  const requireAuth = useRequireAuth();

  const vote = useLikeComment();

  const myVote = commentView?.optimisticMyVote ?? commentView?.myVote ?? 0;

  const isUpvoted = myVote > 0;
  const isDownvoted = myVote < 0;

  const diff =
    typeof commentView?.optimisticMyVote === "number"
      ? commentView?.optimisticMyVote - (commentView?.myVote ?? 0)
      : 0;

  const score = commentView?.counts.score + diff;

  return (
    <div className="flex flex-row items-center -mr-2.5">
      <Button
        id={id}
        size="icon"
        variant="ghost"
        onClick={async () => {
          const newVote = isUpvoted ? 0 : 1;
          voteHaptics(newVote);
          requireAuth().then(() => {
            vote.mutate({
              post_id: commentView.comment.post_id,
              comment_id: commentView.comment.id,
              score: newVote,
              path: commentView.comment.path,
            });
          });
        }}
        //disabled={vote.isPending}
        className={cn(
          "hover:text-brand",
          isUpvoted && "text-brand",
          isDownvoted && "text-destructive",
        )}
      >
        {isUpvoted ? <PiArrowFatUpFill /> : <PiArrowFatUpBold />}
      </Button>
      <label
        htmlFor={id}
        className={cn("-mx-0.5 cursor-pointer", isUpvoted && "text-brand")}
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
              post_id: commentView.comment.post_id,
              comment_id: commentView.comment.id,
              score: newVote,
              path: commentView.comment.path,
            });
          });
        }}
        //disabled={vote.isPending}
        className={cn(
          "hover:text-destructive",
          isDownvoted && "text-destructive",
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
