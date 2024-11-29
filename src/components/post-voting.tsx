import { PostView } from "lemmy-js-client";
import { Button, View, Text } from "tamagui";
import { ArrowBigUp, ArrowBigDown } from "@tamagui/lucide-icons";

export function Voting({ postView }: { postView: PostView }) {
  return (
    <View dsp="flex" fd="row" ai="center" bg="$gray2" borderRadius="$12">
      <Button aspectRatio={1} bg="$gray2" size={32} borderRadius="$12" p={4}>
        <ArrowBigUp />
      </Button>
      <Text fontSize="$5">{postView.counts.upvotes}</Text>
      <Button aspectRatio={1} bg="$gray2" size={32} borderRadius="$12" p={4}>
        <ArrowBigDown />
      </Button>
    </View>
  );
}
