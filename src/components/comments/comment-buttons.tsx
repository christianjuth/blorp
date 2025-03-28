import { Button, useTheme, Text, XStack, ButtonProps } from "tamagui";
import { ArrowBigUp, ArrowBigDown, Reply } from "@tamagui/lucide-icons";
import { FlattenedComment, useLikeComment } from "~/src/lib/lemmy/index";
import { voteHaptics } from "~/src/lib/voting";
import { useRequireAuth } from "../auth-context";

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

  const theme = useTheme();

  const score = commentView?.counts.score + diff;

  return (
    <XStack dsp="flex" fd="row" ai="center" borderRadius="$12">
      <Button
        onPress={async () => {
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
        unstyled
        bg="transparent"
        bw={0}
        p={0}
        py="$1"
        fd="row"
        ai="center"
      >
        <>
          <ArrowBigUp
            // Not sure why this is nessesary, but
            // it wasn't clearning the color without
            // this when you undo your vote
            key={isUpvoted ? 1 : 0}
            size="$1"
            fill={isUpvoted ? theme.accentBackground.val : theme.background.val}
            color={isUpvoted ? "$accentBackground" : "$color11"}
            mr={5}
          />
          <Text color={isUpvoted ? "$accentBackground" : "$color11"}>
            {score}
          </Text>
        </>
      </Button>
      <Button
        onPress={async () => {
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
        unstyled
        bg="transparent"
        bw={0}
        p={0}
        pl={5}
        py="$1"
      >
        <ArrowBigDown
          // Not sure why this is nessesary, but
          // it wasn't clearning the color without
          // this when you undo your vote
          key={isDownvoted ? 1 : 0}
          size="$1"
          fill={isDownvoted ? theme.red.val : theme.background.val}
          color={isDownvoted ? "$red" : "$color11"}
        />
      </Button>
    </XStack>
  );
}

export function CommentReplyButton(props: Omit<ButtonProps, "children">) {
  return (
    <Button unstyled bg="transparent" bw={0} p={0} ml={6} {...props}>
      <XStack gap="$1" ai="center">
        <Reply size="$1" color="$color11" />
        <Text fontSize="$3" color="$color11">
          Reply
        </Text>
      </XStack>
    </Button>
  );
}
