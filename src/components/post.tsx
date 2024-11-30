import { Text, View } from "tamagui";
import { Image } from "@tamagui/image-next";
import { PostView } from "lemmy-js-client";
import { Voting, ExpandPost } from "./post-buttons";
import { abbriviateNumber } from "../lib/format";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { RelativeTime } from "./relative-time";
dayjs.extend(relativeTime);

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
  const { post, creator, community, counts } = postView;
  const server = new URL(post.ap_id);
  return (
    <View
      minHeight={POST_HEIGHT}
      dsp="flex"
      fd="row"
      gap="$3"
      w="100%"
      $md={{ px: "unset" }}
      px="$2.5"
    >
      <View h={POST_HEIGHT} aspectRatio={1}>
        <Image
          src={post.thumbnail_url}
          h={POST_HEIGHT}
          aspectRatio={1}
          objectFit="cover"
          onPress={toggleExpand}
          borderRadius="$3"
        />
      </View>
      <View flexShrink="unset" flex={1}>
        <View
          dsp="flex"
          fd="column"
          jc="space-between"
          flexShrink="unset"
          gap={5}
          minHeight={POST_HEIGHT}
        >
          <View dsp="flex" fd="row">
            <Text color="$color10" fontSize="$2">
              @{creator.name} to {community.title}@{server.host} •{" "}
            </Text>
            <RelativeTime
              time={post.published}
              color="$color10"
              fontSize="$2"
            />
          </View>
          <Text fontWeight="bold" lineHeight="$2">
            {post.name}
          </Text>
          <View dsp="flex" fd="row" ai="center" gap="$2">
            <ExpandPost toggleExpand={toggleExpand} />
            <Voting postView={postView} />
            <Text fontSize="$3">
              {abbriviateNumber(counts.comments)} comments
            </Text>
          </View>
        </View>
        {expanded && (
          <Image
            src={post.thumbnail_url}
            objectFit="contain"
            onPress={toggleExpand}
            height={EXPANDED_POST_HEIGHT - POST_HEIGHT}
            $platform-web={{ height: "unset", b: "red" }}
            dsp="flex"
            fd="row"
            jc="center"
            mt={PADDING}
            objectPosition="center"
            bg="$color4"
            w="100%"
            borderRadius="$2"
          />
        )}
      </View>
    </View>
  );
}
