import { CommunityView } from "lemmy-js-client";
import { Text, YStack, XStack, Square } from "tamagui";
import { Link } from "one";
import { abbriviateNumber } from "~/src/lib/format";
import { createCommunitySlug } from "../lib/lemmy/utils";
import { useLinkContext } from "./nav/link-context";

export function Community({ communityView }: { communityView: CommunityView }) {
  const { community, counts } = communityView;
  const slug = createCommunitySlug(community);

  const linkCtx = useLinkContext();

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
      >
        <Square
          size="$3"
          borderRadius={9999}
          backgroundColor="$color8"
          ai="center"
          jc="center"
        >
          <Text fontSize="$4">{community.title.substring(0, 1)}</Text>
        </Square>
        <YStack gap="$1" flex={1}>
          <Text fontSize="$3" numberOfLines={1} textOverflow="ellipsis">
            {createCommunitySlug(community)}
          </Text>
          <Text fontSize="$3" col="$color11">
            {abbriviateNumber(counts.subscribers)} members •{" "}
            {abbriviateNumber(counts.posts)} posts
          </Text>
        </YStack>
      </XStack>
    </Link>
  );
}
