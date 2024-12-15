import { Text, View, XStack, YStack } from "tamagui";
import { Image } from "~/src/components/image";
import { PostView } from "lemmy-js-client";
import { Voting } from "./post-buttons";
import { Link } from "one";
import { Byline } from "../byline";
import { createCommunitySlug } from "~/src/lib/lemmy";
import { useState } from "react";

export function PostCard({ postView }: { postView: PostView }) {
  const { post, creator, community, counts } = postView;
  const thumbnail = post?.thumbnail_url;
  const slug = createCommunitySlug(community);

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

      <Link href={`/c/${slug}/posts/${post.id}`} asChild>
        <YStack
          gap="$1"
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
        >
          <Text fontWeight={500} fontSize="$6" lineHeight="$3">
            {post.name}
          </Text>

          {thumbnail && (
            <View $md={{ mx: "$-2.5" }}>
              <Image imageUrl={thumbnail} priority />
            </View>
          )}
        </YStack>
      </Link>

      <XStack jc="flex-end" ai="center">
        {postView && <Voting postView={postView} />}
      </XStack>
    </YStack>
  );
}
