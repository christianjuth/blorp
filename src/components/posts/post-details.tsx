import { Text, View, XStack, YStack } from "tamagui";
import { Image } from "~/src/components/image";
import { Markdown } from "~/src/components/markdown";
import { Voting } from "~/src/components/posts/post-buttons";
import { Byline } from "../byline";
import { usePostsStore } from "~/src/stores/posts";

export function PostDetail({ postId }: { postId: number | string }) {
  const postView = usePostsStore((s) => s.posts[postId]?.data);

  if (!postView) {
    return null;
  }

  const post = postView.post;
  const thumbnail = post?.thumbnail_url;
  const body = post?.body;

  return (
    <YStack
      $md={{
        px: "$2.5",
      }}
      py="$2.5"
      bbc="$color3"
      bbw={8}
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

      {thumbnail && (
        <View $md={{ mx: "$-2.5" }}>
          <Image imageUrl={thumbnail} priority />
        </View>
      )}
      {body && <Markdown markdown={body} />}

      <XStack jc="flex-end" ai="center" mt="$1.5">
        {postView && <Voting postId={postId} />}
      </XStack>
    </YStack>
  );
}
