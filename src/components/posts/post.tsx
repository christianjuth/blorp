import { Text, View, YStack } from "tamagui";
import { Image } from "~/src/components/image";
import { PostView } from "lemmy-js-client";
import { Voting } from "./post-buttons";
import { Link } from "one";
import { Byline } from "../byline";

export function PostCard({ postView }: { postView: PostView }) {
  const { post, creator, community, counts } = postView;
  const server = new URL(post.ap_id);
  const thumbnail = post?.thumbnail_url;

  return (
    <Link href={`/c/${community.id}/posts/${post.id}`} asChild>
      <YStack
        py="$2.5"
        gap="$2"
        bbc="$color5"
        bbw={2}
        tag="a"
        mx="auto"
        flex={1}
        $md={{
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
