import { Button, View, Text, useTheme } from "tamagui";
import { ArrowBigUp, ArrowBigDown, Expand } from "@tamagui/lucide-icons";
import { abbriviateNumber } from "~/src/lib/format";
import { useLikePost, FlattenedPost } from "~/src/lib/lemmy";
import { voteHaptics } from "~/src/lib/voting";
import { usePostsStore } from "~/src/stores/posts";

export function Voting({ postId }: { postId: number | string }) {
  const postView = usePostsStore((s) => s.posts[postId]?.data);

  if (!postView) {
    return null;
  }

  const vote = useLikePost(postView.post.id);

  const theme = useTheme();

  const myVote = postView.optimisticMyVote ?? postView.myVote ?? 0;

  const isUpvoted = myVote > 0;
  const isDownvoted = myVote < 0;

  const diff =
    typeof postView.optimisticMyVote === "number"
      ? postView.optimisticMyVote - (postView.myVote ?? 0)
      : 0;

  const score = postView.score + diff;

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
        onPress={() => {
          const newVote = isUpvoted ? 0 : 1;
          voteHaptics(newVote);
          vote.mutate(newVote);
        }}
        disabled={vote.isPending}
        gap="$1"
      >
        <>
          <ArrowBigUp
            fill={isUpvoted ? theme.accentBackground.val : undefined}
            color={isUpvoted ? "$accentBackground" : undefined}
            size="$1"
          />
          <Text
            fontSize="$5"
            color={
              isUpvoted ? "$accentBackground" : isDownvoted ? "$red" : undefined
            }
            px={2}
          >
            {abbriviateNumber(score)}
          </Text>
        </>
      </Button>
      <View h={16} w={1} bg="$color6" mx={4} />
      <Button
        h="$2"
        borderRadius="$12"
        p={0}
        pr={7}
        bg="transparent"
        onPress={() => {
          const newVote = isDownvoted ? 0 : -1;
          voteHaptics(newVote);
          vote.mutate(newVote);
        }}
        disabled={vote.isPending}
      >
        <ArrowBigDown
          fill={isDownvoted ? theme.red.val : undefined}
          color={isDownvoted ? "$red" : undefined}
          size="$1"
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
