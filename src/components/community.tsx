import { CommunityView } from "lemmy-js-client";
import { Text, YStack, Avatar, XStack } from "tamagui";
import { Link } from "one";
import { abbriviateNumber } from "~/src/lib/format";
import { Image } from "./image";
import { usePosts } from "../lib/lemmy";
import { createCommunitySlug } from "../lib/lemmy/utils";
import { useLinkContext } from "./nav/link-context";

export function Community({ communityView }: { communityView: CommunityView }) {
  const { community, counts } = communityView;
  const slug = createCommunitySlug(community);

  const linkCtx = useLinkContext();

  const posts = usePosts({
    community_name: slug,
    enabled: false,
  });

  return (
    <Link href={`${linkCtx.root}c/${slug}`} asChild push>
      <XStack
        flex={1}
        ai="center"
        gap="$2"
        tag="a"
        py="$2"
        overflow="hidden"
        $md={{ px: "$3" }}
        onPress={posts.prefetch}
      >
        <Avatar size="$3" borderRadius="$12">
          {community.icon && (
            <YStack
              fullscreen
              zIndex={1}
              bg="$background"
              borderRadius="$12"
              overflow="hidden"
            >
              <Image
                key={community.icon}
                imageUrl={community.icon}
                style={{
                  height: "100%",
                  width: "100%",
                }}
              />
            </YStack>
          )}
          <Avatar.Fallback
            backgroundColor="$color8"
            borderRadius="$12"
            ai="center"
            jc="center"
          >
            <Text fontSize="$4">{community.title.substring(0, 1)}</Text>
          </Avatar.Fallback>
        </Avatar>
        <YStack gap="$1" flex={1}>
          <Text fontSize="$3" numberOfLines={1} textOverflow="ellipsis">
            {community.title}
          </Text>
          <Text fontSize="$3">
            {abbriviateNumber(counts.subscribers)} members •{" "}
            {abbriviateNumber(counts.posts)} posts
          </Text>
        </YStack>
      </XStack>
    </Link>
  );
}
