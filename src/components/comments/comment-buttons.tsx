import { CommentView } from "lemmy-js-client";
import { Button, View, Text, useTheme } from "tamagui";
import { ArrowBigUp, ArrowBigDown } from "@tamagui/lucide-icons";
import { abbriviateNumber } from "~/src/lib/format";

export function CommentVoting({ postView }: { postView: CommentView }) {
  // const vote = useVote();

  const isUpvoted = postView.my_vote && postView.my_vote > 0;
  const isDownvoted = postView.my_vote && postView.my_vote < 0;

  const theme = useTheme();

  return (
    <View dsp="flex" fd="row" ai="center" borderRadius="$12" gap="$1.5">
      <Button
        aspectRatio={1}
        bg="$color5"
        h="$2"
        borderRadius="$12"
        p={3}
        hoverStyle={{ bg: "$color7" }}
        // onPress={() =>
        //   vote.mutate({
        //     post_id: postView.post.id,
        //     score: isUpvoted ? 0 : 1,
        //   })
        // }
        // disabled={vote.isPending}
        asChild
      >
        <ArrowBigUp
          size="$1"
          fill={isUpvoted ? theme.accentBackground.val : undefined}
          color={isUpvoted ? "$accentBackground" : undefined}
        />
      </Button>
      <Text fontSize="$4">{abbriviateNumber(postView.counts.upvotes)}</Text>
      <Button
        aspectRatio={1}
        bg="$color5"
        h="$2"
        borderRadius="$12"
        p={3}
        hoverStyle={{ bg: "$color7" }}
        // onPress={() =>
        //   vote.mutate({
        //     post_id: postView.post.id,
        //     score: isDownvoted ? 0 : -1,
        //   })
        // }
        // disabled={vote.isPending}
        asChild
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
