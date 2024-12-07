import { Text, View, YStack } from "tamagui";
import { Image as TImage } from "@tamagui/image-next";
import { Image } from "~/src/components/image";
import { PostView } from "lemmy-js-client";
import { Voting, ExpandPost } from "./post-buttons";
import { abbriviateNumber } from "~/src/lib/format";
import { Link } from "one";
import { RelativeTime } from "~/src/components/relative-time";
import { Byline } from "../byline";

export function PostCard({ postView }: { postView: PostView }) {
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
        {thumbnail && (
          <Image
            // sharedTransitionTag={String(post.id)}
            imageUrl={thumbnail}
            priority
            borderRadius={15}
          />
        )}
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
