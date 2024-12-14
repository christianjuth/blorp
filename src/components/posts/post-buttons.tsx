import { PostView } from "lemmy-js-client";
import { Button, View, Text, useTheme } from "tamagui";
import { ArrowBigUp, ArrowBigDown, Expand } from "@tamagui/lucide-icons";
import { abbriviateNumber } from "~/src/lib/format";
import { useVote, usePost } from "~/src/lib/lemmy";

export function Voting({ postView }: { postView: PostView }) {
  const vote = useVote();

  const theme = useTheme();

  const { data } = usePost(
    {
      id: String(postView.post.id),
    },
    false,
  );

  const myVote = data.post_view?.my_vote ?? postView.my_vote ?? 0;

  const isUpvoted = myVote > 0;
  const isDownvoted = myVote < 0;

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
        bg="$color5"
        h="$2"
        borderRadius="$12"
        p={3}
        hoverStyle={{ bg: "$color7" }}
        onPress={() =>
          vote.mutate({
            post_id: postView.post.id,
            score: isUpvoted ? 0 : 1,
          })
        }
        disabled={vote.isPending}
      >
        <ArrowBigUp
          fill={isUpvoted ? theme.accentBackground.val : undefined}
          color={isUpvoted ? "$accentBackground" : undefined}
        />
      </Button>
      <Text
        fontSize="$5"
        color={
          isUpvoted ? "$accentBackground" : isDownvoted ? "$red" : undefined
        }
      >
        {abbriviateNumber(postView.counts.score)}
      </Text>
      <Button
        aspectRatio={1}
        bg="$color5"
        h="$2"
        borderRadius="$12"
        p={3}
        hoverStyle={{ bg: "$color7" }}
        onPress={() =>
          vote.mutate({
            post_id: postView.post.id,
            score: isDownvoted ? 0 : -1,
          })
        }
        disabled={vote.isPending}
      >
        <ArrowBigDown
          fill={isDownvoted ? theme.red.val : undefined}
          color={isDownvoted ? "$red" : undefined}
        />
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
