import { CommunityView } from "lemmy-js-client";
import { Text, YStack, Avatar, XStack } from "tamagui";
import { Link } from "one";
import { abbriviateNumber } from "~/src/lib/format";
import { createCommunitySlug } from "../lib/lemmy";
import FastImage from "~/src/components/fast-image";
import { useState } from "react";

export function Community({ communityView }: { communityView: CommunityView }) {
  const { community, counts } = communityView;
  const slug = createCommunitySlug(community);
  const [iconReady, setIconReady] = useState(false);

  return (
    <Link href={`/communities/c/${slug}`} asChild push>
      <XStack ai="center" gap="$2" tag="a" p="$2" overflow="hidden">
        <Avatar size="$3.5" borderRadius="$12">
          {community.icon && (
            <YStack
              fullscreen
              zIndex={1}
              bg={iconReady ? "$color1" : undefined}
              borderRadius="$12"
              overflow="hidden"
            >
              <FastImage
                source={{ uri: community.icon }}
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                }}
                resizeMode="cover"
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
          <Text fontSize="$3.5" numberOfLines={1} textOverflow="ellipsis">
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
