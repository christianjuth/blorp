import { Button, useTheme, Text, XStack, ButtonProps } from "tamagui";
import { ArrowBigUp, ArrowBigDown, Reply } from "@tamagui/lucide-icons";
import { FlattenedComment, useLikeComment } from "~/src/lib/lemmy";
import { voteHaptics } from "~/src/lib/voting";
import { useMemo, useState } from "react";
import { AnimatedRollingNumber } from "~/src/components/animated-digit";
import { useRequireAuth } from "../auth-context";

const DISABLE_ANIMATION = {
  duration: 0,
};

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
  const [animate, setAnimate] = useState(false);

  const textColor = isUpvoted
    ? theme.accentBackground.val
    : isDownvoted
      ? theme.red.val
      : theme.color11.val;
  const textStyle = useMemo(() => {
    return {
      color: textColor,
    };
  }, [textColor]);

  return (
    <XStack dsp="flex" fd="row" ai="center" borderRadius="$12">
      <Button
        onPress={async () => {
          const newVote = isUpvoted ? 0 : 1;
          voteHaptics(newVote);
          requireAuth().then(() => {
            setAnimate(true);
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
            size="$1"
            fill={isUpvoted ? theme.accentBackground.val : undefined}
            color={isUpvoted ? "$accentBackground" : "$color11"}
            mr={5}
          />
          <AnimatedRollingNumber
            enableCompactNotation
            value={score}
            textStyle={textStyle}
            spinningAnimationConfig={
              // THIS IS A HACK
              // Find a better way to disable animation for init value
              !animate ? DISABLE_ANIMATION : undefined
            }
          />
        </>
      </Button>
      <Button
        onPress={async () => {
          const newVote = isDownvoted ? 0 : -1;
          voteHaptics(newVote);
          requireAuth().then(() => {
            setAnimate(true);
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
          size="$1"
          fill={isDownvoted ? theme.red.val : undefined}
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
