import { Button, View, Text, useTheme } from "tamagui";
import { ArrowBigUp, ArrowBigDown, MessageCircle } from "@tamagui/lucide-icons";
import { useLikePost } from "~/src/lib/lemmy/index";
import { voteHaptics } from "~/src/lib/voting";
import { useRequireAuth } from "../auth-context";

export function Voting({
  apId,
  myVote,
  score,
}: {
  apId: string;
  myVote: number;
  score: number;
}) {
  const requireAuth = useRequireAuth();

  const vote = useLikePost(apId);

  const theme = useTheme();

  const isUpvoted = myVote > 0;
  const isDownvoted = myVote < 0;

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
          <Text color={isUpvoted ? "$accentBackground" : undefined}>
            {score}
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
        onPress={async () => {
          const newVote = isDownvoted ? 0 : -1;
          voteHaptics(newVote);
          requireAuth().then(() => {
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
  commentsCount,
  ...rest
}: {
  commentsCount: number;
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
      <Text fontSize="$5">{commentsCount}</Text>
    </Button>
  );
}
