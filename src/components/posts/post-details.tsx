import { Text, View, XStack, YStack } from "tamagui";
import { Image } from "~/src/components/image";
import { Markdown } from "~/src/components/markdown";
import { Voting } from "~/src/components/posts/post-buttons";
import { PostView } from "lemmy-js-client";
import { Byline } from "../byline";

export function PostDetail({ postView }: { postView: PostView }) {
  const post = postView.post;
  const thumbnail = post?.thumbnail_url;
  const body = post?.body;

  return (
    <YStack
      $md={{
        px: "$2.5",
      }}
      py="$2.5"
      bbc="$color2"
      bbw={7}
      gap="$2"
      flex={1}
    >
      <Byline
        avatar={postView.community.icon}
        author={postView.creator.name}
        publishedDate={post.published}
        comunityName={postView.community.name}
      />

      <Text fontWeight={500} fontSize="$6" lineHeight="$3">
        {post.name}
      </Text>

      {thumbnail && <Image imageUrl={thumbnail} priority borderRadius={15} />}
      {body && <Markdown markdown={body} />}

      <XStack jc="flex-end" ai="center" mt="$1.5">
        {postView && <Voting postView={postView} />}
      </XStack>
    </YStack>
  );
}
