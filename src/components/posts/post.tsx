import { Text, View, XStack, YStack } from "tamagui";
import { Image } from "~/src/components/image";
import { PostView } from "lemmy-js-client";
import { Voting } from "./post-buttons";
import { Link } from "one";
import { Byline } from "../byline";
import { createCommunitySlug } from "~/src/lib/lemmy";

export function PostCard({ postView }: { postView: PostView }) {
  const { post, creator, community, counts } = postView;
  const thumbnail = post?.thumbnail_url;
  const slug = createCommunitySlug(community);

  return (
    <YStack
      py="$2"
      bbc="$color2"
      bbw={7}
      tag="a"
      mx="auto"
      flex={1}
      $md={{
        px: "$2.5",
      }}
      gap="$1.5"
    >
      <Byline
        avatar={community.icon}
        author={creator.name}
        publishedDate={post.published}
      />

      <Link href={`/c/${slug}/posts/${post.id}`} asChild>
        <YStack gap="$1">
          <Text fontWeight={500} fontSize="$6" lineHeight="$3">
            {post.name}
          </Text>

          {thumbnail && (
            <Image imageUrl={thumbnail} priority borderRadius={15} />
          )}
        </YStack>
      </Link>

      <XStack jc="flex-end" ai="center">
        {postView && <Voting postView={postView} />}
      </XStack>
    </YStack>
  );
}
