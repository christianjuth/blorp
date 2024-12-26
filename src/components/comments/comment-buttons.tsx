import { Button, View, useTheme, Text, XStack } from "tamagui";
import { ArrowBigUp, ArrowBigDown, MessageCircle } from "@tamagui/lucide-icons";
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
    <View dsp="flex" fd="row" ai="center" borderRadius="$12">
      <Button
        onPress={() => {
          requireAuth().then(() => {
            setAnimate(true);
            const newVote = isUpvoted ? 0 : 1;
            voteHaptics(newVote);
            // THIS IS A HACK
            // I'm not sure why but having this not
            // wrapped in set timeout cases a delay
            // in setMyVote() rerendering comp
            setTimeout(() => {
              vote.mutate({
                post_id: commentView.comment.post_id,
                comment_id: commentView.comment.id,
                score: newVote,
              });
            }, 0);
          });
        }}
        disabled={vote.isPending}
        unstyled
        bg="transparent"
        bw={0}
        p={0}
        mr={6}
      >
        <ArrowBigUp
          size="$1"
          fill={isUpvoted ? theme.accentBackground.val : undefined}
          color={isUpvoted ? "$accentBackground" : "$color11"}
        />
      </Button>
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
      <Button
        onPress={() => {
          requireAuth().then(() => {
            setAnimate(true);
            const newVote = isDownvoted ? 0 : -1;
            voteHaptics(newVote);
            // THIS IS A HACK
            // I'm not sure why but having this not
            // wrapped in set timeout cases a delay
            // in setMyVote() rerendering comp
            setTimeout(() => {
              vote.mutate({
                post_id: commentView.comment.post_id,
                comment_id: commentView.comment.id,
                score: newVote,
              });
            }, 0);
          });
        }}
        disabled={vote.isPending}
        unstyled
        bg="transparent"
        bw={0}
        p={0}
        ml={6}
      >
        <ArrowBigDown
          size="$1"
          fill={isDownvoted ? theme.red.val : undefined}
          color={isDownvoted ? "$red" : "$color11"}
        />
      </Button>
    </View>
  );
}

export function CommentReplyButton({
  onPress,
  commentView,
}: {
  onPress: () => void;
  commentView: FlattenedComment;
}) {
  return (
    <Button unstyled bg="transparent" bw={0} p={0} ml={6} onPress={onPress}>
      <XStack gap="$1" ai="center">
        <MessageCircle size="$1" />
        <Text fontSize="$3">Reply</Text>
      </XStack>
    </Button>
  );
}
