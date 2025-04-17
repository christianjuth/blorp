import { FlattenedComment, useLikeComment } from "@/src/lib/lemmy/index";
import { voteHaptics } from "@/src/lib/voting";
import { useRequireAuth } from "../auth-context";
import { ButtonHTMLAttributes, DetailedHTMLProps } from "react";
import { cn } from "@/src/lib/utils";
import {
  PiArrowBendUpLeftBold,
  PiArrowFatUpBold,
  PiArrowFatDownBold,
  PiArrowFatDownFill,
  PiArrowFatUpFill,
} from "react-icons/pi";

export function CommentVoting({
  commentView,
}: {
  commentView: FlattenedComment;
}) {
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
    <div className="flex flex-row items-center">
      <button
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
        disabled={vote.isPending}
        className={cn(
          "pr-1.5 flex items-center space-x-2 text-left",
          isUpvoted && "text-brand",
        )}
      >
        <>
          {isUpvoted ? <PiArrowFatUpFill /> : <PiArrowFatUpBold />}

          {/* <ArrowBigUp */}
          {/*   // Not sure why this is nessesary, but */}
          {/*   // it wasn't clearning the color without */}
          {/*   // this when you undo your vote */}
          {/*   key={isUpvoted ? 1 : 0} */}
          {/*   size="$1" */}
          {/*   fill={isUpvoted ? theme.accentBackground.val : theme.background.val} */}
          {/*   color={isUpvoted ? "$accentBackground" : "$color11"} */}
          {/*   mr={5} */}
          {/* /> */}
          <span>{score}</span>
        </>
      </button>
      <button
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
        disabled={vote.isPending}
        className={cn(
          "pl-0.5 flex items-center",
          isDownvoted && "text-destructive",
        )}
      >
        {isDownvoted ? <PiArrowFatDownFill /> : <PiArrowFatDownBold />}
      </button>
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
    <button
      {...props}
      className={cn("flex flex-row items-center gap-1", props.className)}
    >
      <PiArrowBendUpLeftBold />
      <span>Reply</span>
    </button>
  );
}
