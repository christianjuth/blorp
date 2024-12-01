import { PostView } from "lemmy-js-client";
import { Button, View, Text } from "tamagui";
import { ArrowBigUp, ArrowBigDown, Expand } from "@tamagui/lucide-icons";
import { abbriviateNumber } from "~/src/lib/format";

export function Voting({ postView }: { postView: PostView }) {
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
      <Text fontSize="$5">{abbriviateNumber(postView.counts.upvotes)}</Text>
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
