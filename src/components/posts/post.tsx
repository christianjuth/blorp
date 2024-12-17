import { Text, View, XStack, YStack } from "tamagui";
import { Image } from "~/src/components/image";
import { Voting } from "./post-buttons";
import { Link } from "one";
import { Byline } from "../byline";
import { useState } from "react";
import { usePostsStore } from "~/src/stores/posts";

export function PostCard({ postId }: { postId: number }) {
  const postView = usePostsStore((s) => s.posts[postId]?.data);

  if (!postView) {
    return null;
  }

  const { community, creator, post } = postView;

  const [pressed, setPressed] = useState(false);

  return (
    <YStack
      py="$4"
      bbc="$color3"
      bbw={1}
      tag="a"
      mx="auto"
      flex={1}
      $md={{
        px: "$2.5",
        bbw: 8,
        py: "$2",
      }}
      gap="$1.5"
      // bg={pressed ? "$color3" : "$color1"}
      opacity={pressed ? 0.8 : 1}
      animation="100ms"
    >
      <Byline
        avatar={community.icon}
        author={creator.name}
        publishedDate={post.published}
      />

      <Link href={`/c/${community.slug}/posts/${post.id}`} asChild>
        <YStack
          gap="$1"
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
        >
          <Text fontWeight={500} fontSize="$6" lineHeight="$3">
            {post.name}
          </Text>

          {post.thumbnail_url && (
            <View $md={{ mx: "$-2.5" }}>
              <Image imageUrl={post.thumbnail_url} priority />
            </View>
          )}
        </YStack>
      </Link>

      <XStack jc="flex-end" ai="center">
        {postView && <Voting postId={postId} />}
      </XStack>
    </YStack>
  );
}
