import { CommunityView } from "lemmy-js-client";
import { Text, YStack, Avatar, XStack } from "tamagui";
import { Link } from "one";
import { abbriviateNumber } from "~/src/lib/format";
import { createCommunitySlug } from "../lib/community";
import { useState } from "react";
import { Image } from "expo-image";
import { usePosts } from "../lib/lemmy";

export function Community({ communityView }: { communityView: CommunityView }) {
  const { community, counts } = communityView;
  const slug = createCommunitySlug(community);
  const [iconReady, setIconReady] = useState(false);

  const posts = usePosts({
    community_name: slug,
    enabled: false,
  });

  return (
    <Link href={`/communities/c/${slug}`} asChild push>
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
              bg={iconReady ? "$background" : undefined}
              borderRadius="$12"
              overflow="hidden"
            >
              <Image
                key={community.icon}
                source={{
                  uri: community.icon,
                }}
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                }}
                onLoad={() => setIconReady(true)}
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
