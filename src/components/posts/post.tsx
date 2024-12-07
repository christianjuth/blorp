import { Text, View, YStack } from "tamagui";
import { Image as TImage } from "@tamagui/image-next";
import { Image } from "~/src/components/image";
import { PostView } from "lemmy-js-client";
import { Voting, ExpandPost } from "./post-buttons";
import { abbriviateNumber } from "~/src/lib/format";
import { Link } from "one";
import { RelativeTime } from "~/src/components/relative-time";
import { Byline } from "../byline";
import Animated from "react-native-reanimated";

export const POST_HEIGHT = 110;
const PADDING = 10;
const BORDER_HEIGHT = 1;
const POST_INNER_HEIGHT = POST_HEIGHT - BORDER_HEIGHT - PADDING * 2;
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
  const href = `/posts/${post.id}`;
  return (
    <View
      minHeight={POST_INNER_HEIGHT}
      dsp="flex"
      fd="row"
      gap="$3"
      flex={1}
      $md={{ px: "$2.5" }}
      py={PADDING}
      $theme-dark={{ bbc: "$color3" }}
      $gtMd={{
        mx: "$2.5",
      }}
      bg="$color1"
    >
      <View h={POST_INNER_HEIGHT} aspectRatio={1}>
        <TImage
          src={post.thumbnail_url}
          h={POST_INNER_HEIGHT}
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
          minHeight={POST_INNER_HEIGHT}
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
          <Link href={href as any}>
            <Text fontWeight="bold" lineHeight="$2">
              {post.name}
            </Text>
          </Link>
          <View dsp="flex" fd="row" ai="center" gap="$2">
            <ExpandPost toggleExpand={toggleExpand} />
            <Voting postView={postView} />
            <Text fontSize="$3">
              {abbriviateNumber(counts.comments)} comments
            </Text>
          </View>
        </View>
        {expanded && (
          <TImage
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

export function PostCard({
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
  const href = `/posts/${post.id}`;

  const thumbnail = post?.thumbnail_url;

  return (
    <Link href={href as any} asChild>
      <YStack
        py="$2.5"
        gap="$2"
        bbc="$color5"
        bbw={1}
        tag="a"
        maxWidth={750}
        mx="auto"
        w="100%"
        $sm={{
          px: "$2.5",
        }}
      >
        <Text fontWeight={500} fontSize="$8" lineHeight="$7">
          {post.name}
        </Text>
        {thumbnail && <Image imageUrl={thumbnail} priority borderRadius={15} />}
        <Byline
          avatar={community.icon}
          author={creator.name}
          publishedDate={post.published}
        />

        <View dsp="flex" fd="row" ai="flex-start">
          {postView && <Voting postView={postView} />}
        </View>
      </YStack>
    </Link>
  );
}
