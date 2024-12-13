import { PostView } from "lemmy-js-client";
import { Button, View, Text } from "tamagui";
import { ArrowBigUp, ArrowBigDown, Expand } from "@tamagui/lucide-icons";
import { abbriviateNumber } from "~/src/lib/format";
import { useVote } from "~/src/lib/lemmy";

export function Voting({ postView }: { postView: PostView }) {
  const vote = useVote();

  const isUpvoted = postView.my_vote && postView.my_vote > 0;
  const isDownvoted = postView.my_vote && postView.my_vote < 0;

  return (
    <View
      dsp="flex"
      fd="row"
      ai="center"
      bg="$color5"
      borderRadius="$12"
      gap="$1.5"
    >
      <Button
        aspectRatio={1}
        bg={isUpvoted ? "$accentColor" : "$color5"}
        h="$2"
        borderRadius="$12"
        p={4}
        hoverStyle={{ bg: "$color7" }}
        onPress={() =>
          vote.mutate({
            post_id: postView.post.id,
            score: isUpvoted ? 0 : 1,
          })
        }
        disabled={vote.isPending}
      >
        <ArrowBigUp />
      </Button>
      <Text fontSize="$5">{abbriviateNumber(postView.counts.upvotes)}</Text>
      <Button
        aspectRatio={1}
        bg={isDownvoted ? "$accentColor" : "$color5"}
        h="$2"
        borderRadius="$12"
        p={4}
        hoverStyle={{ bg: "$color7" }}
        onPress={() =>
          vote.mutate({
            post_id: postView.post.id,
            score: isDownvoted ? 0 : -1,
          })
        }
        disabled={vote.isPending}
      >
        <ArrowBigDown />
      </Button>
    </View>
  );
}

export function ExpandPost({ toggleExpand }: { toggleExpand: () => any }) {
  return (
    <Button
      aspectRatio={1.5}
      h="$2"
      bg="$color5"
      borderRadius="$12"
      p="$3"
      hoverStyle={{ bg: "$color7" }}
      onPress={toggleExpand}
      $md={{ dsp: "none" }}
    >
      <Expand />
    </Button>
  );
}
