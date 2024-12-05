import { CommentView } from "lemmy-js-client";
import { Button, View, Text } from "tamagui";
import { ArrowBigUp, ArrowBigDown } from "@tamagui/lucide-icons";
import { abbriviateNumber } from "~/src/lib/format";

export function CommentVoting({ commentView }: { commentView: CommentView }) {
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
        p={4}
        hoverStyle={{ bg: "$color7" }}
      >
        <ArrowBigUp />
      </Button>
      <Text fontSize="$5">{abbriviateNumber(commentView.counts.upvotes)}</Text>
      <Button
        aspectRatio={1}
        bg="$color5"
        h="$2"
        borderRadius="$12"
        p={4}
        hoverStyle={{ bg: "$color7" }}
      >
        <ArrowBigDown />
      </Button>
    </View>
  );
}
