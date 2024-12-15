import { CommentView } from "lemmy-js-client";
import { Button, View, Text, useTheme } from "tamagui";
import { ArrowBigUp, ArrowBigDown } from "@tamagui/lucide-icons";
import { abbriviateNumber } from "~/src/lib/format";
import { useLikeComment } from "~/src/lib/lemmy";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export function CommentVoting({ commentView }: { commentView: CommentView }) {
  const vote = useLikeComment();

  const isUpvoted = commentView.my_vote && commentView.my_vote > 0;
  const isDownvoted = commentView.my_vote && commentView.my_vote < 0;

  const theme = useTheme();

  return (
    <View dsp="flex" fd="row" ai="center" borderRadius="$12" gap="$1">
      <Button
        onPress={() => {
          if (Platform.OS !== "web") {
            Haptics.impactAsync(
              isUpvoted
                ? Haptics.ImpactFeedbackStyle.Medium
                : Haptics.ImpactFeedbackStyle.Rigid,
            );
          }
          vote.mutate({
            post_id: commentView.post.id,
            comment_id: commentView.comment.id,
            score: isUpvoted ? 0 : 1,
          });
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
          if (Platform.OS !== "web") {
            Haptics.impactAsync(
              isUpvoted
                ? Haptics.ImpactFeedbackStyle.Medium
                : Haptics.ImpactFeedbackStyle.Rigid,
            );
          }
          vote.mutate({
            post_id: commentView.post.id,
            comment_id: commentView.comment.id,
            score: isDownvoted ? 0 : -1,
          });
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
