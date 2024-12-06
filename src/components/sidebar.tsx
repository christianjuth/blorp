import { Text, YStack, Avatar, XStack } from "tamagui";
import { useListCommunities } from "~/src/lib/lemmy";

export function Sidebar() {
  const { data } = useListCommunities({
    limit: 30,
    sort: "TopDay",
  });

  const communities = data?.pages.map((p) => p.communities).flat();

  return (
    <YStack gap="$2.5">
      {communities?.map(({ community }) => (
        <XStack ai="center" gap="$2" key={community.id}>
          <Avatar size="$2" borderRadius="$12">
            <Avatar.Image src={community.icon} />
            <Avatar.Fallback></Avatar.Fallback>
          </Avatar>
          <Text>{community.name}</Text>
        </XStack>
      ))}
    </YStack>
  );
}
