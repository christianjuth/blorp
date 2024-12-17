import { CommentView } from "lemmy-js-client";
import { Button, View, Text, useTheme } from "tamagui";
import { ArrowBigUp, ArrowBigDown } from "@tamagui/lucide-icons";
import { abbriviateNumber } from "~/src/lib/format";
import { useLikeComment } from "~/src/lib/lemmy";
import { voteHaptics } from "~/src/lib/voting";
import { useEffect, useState } from "react";

export function CommentVoting({ commentView }: { commentView: CommentView }) {
  const vote = useLikeComment();

  const [myVote, setMyVote] = useState(commentView.my_vote ?? 0);

  const isUpvoted = myVote > 0;
  const isDownvoted = myVote < 0;

  useEffect(() => {
    setMyVote((prev) => commentView.my_vote ?? prev);
  }, [commentView]);

  const theme = useTheme();

  return (
    <View dsp="flex" fd="row" ai="center" borderRadius="$12" gap="$1">
      <Button
        onPress={() => {
          const newVote = isUpvoted ? 0 : 1;
          setMyVote(newVote);
          voteHaptics(newVote);
          // THIS IS A HACK
          // I'm not sure why but having this not
          // wrapped in set timeout cases a delay
          // in setMyVote() rerendering comp
          setTimeout(() => {
            vote.mutate({
              post_id: commentView.post.id,
              comment_id: commentView.comment.id,
              score: newVote,
            });
          }, 0);
        }}
        disabled={vote.isPending}
        unstyled
        bg="transparent"
        bw={0}
        p={0}
      >
        <ArrowBigUp
          size="$1"
          fill={isUpvoted ? theme.accentBackground.val : undefined}
          color={isUpvoted ? "$accentBackground" : undefined}
        />
      </Button>
      <Text
        fontSize="$4"
        color={
          isUpvoted ? "$accentBackground" : isDownvoted ? "$red" : undefined
        }
      >
        {abbriviateNumber(commentView.counts.score)}
      </Text>
      <Button
        onPress={() => {
          const newVote = isDownvoted ? 0 : -1;
          voteHaptics(newVote);
          setMyVote(newVote);
          // THIS IS A HACK
          // I'm not sure why but having this not
          // wrapped in set timeout cases a delay
          // in setMyVote() rerendering comp
          setTimeout(() => {
            vote.mutate({
              post_id: commentView.post.id,
              comment_id: commentView.comment.id,
              score: newVote,
            });
          }, 0);
        }}
        disabled={vote.isPending}
        unstyled
        bg="transparent"
        bw={0}
        p={0}
      >
        <ArrowBigDown
          size="$1"
          fill={isDownvoted ? theme.red.val : undefined}
          color={isDownvoted ? "$red" : undefined}
        />
      </Button>
    </View>
  );
}
