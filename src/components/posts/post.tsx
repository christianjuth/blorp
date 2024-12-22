import { Text, View, XStack, YStack } from "tamagui";
import { Image } from "~/src/components/image";
import { PostCommentsButton, Voting } from "./post-buttons";
import { Link } from "one";
import { PostByline } from "./post-byline";
import { useState } from "react";
import { usePostsStore } from "~/src/stores/posts";
import { useLinkContext } from "../communities/link-context";

export function PostCard({ postId }: { postId: number }) {
  const linkCtx = useLinkContext();
  const postView = usePostsStore((s) => s.posts[postId]?.data);

  const [pressed, setPressed] = useState(false);

  const imageDetails = postView?.imageDetails;
  const aspectRatio = imageDetails
    ? imageDetails.width / imageDetails.height
    : undefined;

  if (!postView) {
    return null;
  }

  const { community, post } = postView;

  return (
    <YStack
      py="$4"
      bbc="$color4"
      bbw={1}
      mx="auto"
      flex={1}
      $md={{
        px: "$2.5",
      }}
      gap="$1.5"
      opacity={pressed ? 0.8 : 1}
      animation="100ms"
    >
      <PostByline postView={postView} />

      <Link
        href={`${linkCtx.root}c/${community.slug}/posts/${post.id}`}
        asChild
      >
        <YStack
          gap="$1"
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
          tag="a"
        >
          <Text fontWeight={500} fontSize="$6" lineHeight="$3">
            {post.name}
          </Text>

          {post.thumbnail_url && (
            <View $md={{ mx: "$-2.5" }}>
              <Image imageUrl={post.thumbnail_url} aspectRatio={aspectRatio} />
            </View>
          )}
        </YStack>
      </Link>

      <XStack jc="flex-end" ai="center" gap="$2">
        {postView && <PostCommentsButton postView={postView} />}
        {postView && <Voting postId={postId} />}
      </XStack>
    </YStack>
  );
}
