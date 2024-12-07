import { CommunityView } from "lemmy-js-client";
import { Text, YStack, Avatar, XStack } from "tamagui";
import { Link } from "one";
import { abbriviateNumber } from "~/src/lib/format";

export function Community({ communityView }: { communityView: CommunityView }) {
  const { community, counts } = communityView;
  return (
    <Link href={`/communities/${community.id}`} key={community.id} asChild>
      <XStack ai="center" gap="$2" tag="a" p="$2">
        <Avatar size="$3.5" borderRadius="$12">
          <Avatar.Image src={community.icon} />
          <Avatar.Fallback></Avatar.Fallback>
        </Avatar>
        <YStack gap="$1">
          <Text fontWeight="bold" fontSize="$3.5">
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
