import { Button, View, Text, useTheme } from "tamagui";
import { ArrowBigUp, ArrowBigDown, MessageCircle } from "@tamagui/lucide-icons";
import { useLikePost, FlattenedPost } from "~/src/lib/lemmy";
import { voteHaptics } from "~/src/lib/voting";
import { usePostsStore } from "~/src/stores/posts";
import { AnimatedRollingNumber } from "~/src/components/animated-digit";
import { useMemo, useState } from "react";
import { useRequireAuth } from "../auth-context";

const DISABLE_ANIMATION = {
  duration: 0,
};

export function Voting({ apId }: { apId: string }) {
  const requireAuth = useRequireAuth();

  const postView = usePostsStore((s) => s.posts[apId]?.data);

  const vote = useLikePost(apId);

  const theme = useTheme();

  const myVote = postView?.optimisticMyVote ?? postView?.myVote ?? 0;

  const isUpvoted = myVote > 0;
  const isDownvoted = myVote < 0;

  const diff =
    typeof postView?.optimisticMyVote === "number"
      ? postView?.optimisticMyVote - (postView?.myVote ?? 0)
      : 0;

  const score = postView?.counts.score + diff;
  const [animate, setAnimate] = useState(false);

  const textColor = isUpvoted
    ? theme.accentBackground.val
    : isDownvoted
      ? theme.red.val
      : theme.color.val;
  const textStyle = useMemo(() => {
    return {
      color: textColor,
    };
  }, [textColor]);

  if (!postView) {
    return null;
  }

  return (
    <View
      dsp="flex"
      fd="row"
      ai="center"
      borderRadius="$12"
      bw={1}
      bc="$color5"
    >
      <Button
        h="$2"
        borderRadius="$12"
        p={0}
        pl={7}
        bg="transparent"
        onPress={async () => {
          const newVote = isUpvoted ? 0 : 1;
          voteHaptics(newVote);
          requireAuth().then(() => {
            setAnimate(true);
            vote.mutate(newVote);
          });
        }}
        disabled={vote.isPending}
      >
        <>
          <ArrowBigUp
            // Not sure why this is nessesary, but
            // it wasn't clearning the color without
            // this when you undo your vote
            key={isUpvoted ? 0 : 1}
            fill={isUpvoted ? theme.accentBackground.val : theme.background.val}
            color={isUpvoted ? "$accentBackground" : undefined}
            size="$1"
            mr="$1"
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
      <View h={16} w={1} bg="$color6" mx={4} />
      <Button
        h="$2"
        borderRadius="$12"
        p={0}
        pr={7}
        bg="transparent"
        onPress={async () => {
          const newVote = isDownvoted ? 0 : -1;
          voteHaptics(newVote);
          requireAuth().then(() => {
            setAnimate(true);
            vote.mutate(newVote);
          });
        }}
        disabled={vote.isPending}
      >
        <ArrowBigDown
          key={isDownvoted ? 0 : 1}
          fill={isDownvoted ? theme.red.val : theme.background.val}
          color={isDownvoted ? "$red" : undefined}
          size="$1"
          ml="$1"
        />
      </Button>
    </View>
  );
}

export function PostCommentsButton({
  postView,
  ...rest
}: {
  postView: FlattenedPost;
  onPress?: () => void;
  href?: string;
}) {
  return (
    <Button
      h="$2"
      bg="transparent"
      borderRadius="$12"
      px="$2.5"
      py={0}
      bw={1}
      bc="$color5"
      tag="a"
      {...rest}
    >
      <MessageCircle size={17} />
      <Text fontSize="$5">{postView.counts.comments}</Text>
    </Button>
  );
}
