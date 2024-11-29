import { Text, View } from "tamagui";
import { Image } from "@tamagui/image-next";
import { PostView } from "lemmy-js-client";
import { Voting } from "./post-voting";

export const POST_HEIGHT = 90;
const PADDING = 10;
export const EXPANDED_POST_HEIGHT = POST_HEIGHT * 6 + PADDING;

export function PostCompact({
  postView,
  toggleExpand,
  expanded,
}: {
  postView: PostView;
  toggleExpand: () => any;
  expanded: boolean;
}) {
  const { post, creator, community } = postView;
  const server = new URL(post.ap_id);
  return (
    <View dsp="flex" fd="column" flex={1}>
      <View h={POST_HEIGHT} dsp="flex" fd="row" gap="$3">
        <Image
          src={post.thumbnail_url}
          aspectRatio={1}
          h="100%"
          objectFit="cover"
          onPress={toggleExpand}
        />
        <View dsp="flex" fd="column" jc="space-between">
          <Text color="grey">
            @{creator.name} to {community.title}@{server.host}
          </Text>
          <Text fontWeight="bold">{post.name}</Text>
          <View dsp="flex" fd="row" ai="flex-start">
            <Voting postView={postView} />
          </View>
        </View>
      </View>
      {expanded && (
        <View
          h={EXPANDED_POST_HEIGHT - POST_HEIGHT}
          dsp="flex"
          fd="row"
          jc="center"
          mt={PADDING}
        >
          <Image
            src={post.thumbnail_url}
            aspectRatio={1}
            h="100%"
            objectFit="cover"
            onPress={toggleExpand}
          />
        </View>
      )}
    </View>
  );
}
