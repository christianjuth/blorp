import { XStack, YStack, Text } from "tamagui";
import { useListCommunities } from "~/src/lib/lemmy";
import { Community } from "./community";
import { Home, Users } from "@tamagui/lucide-icons";

export function Sidebar() {
  const { data } = useListCommunities({
    limit: 30,
    sort: "TopDay",
  });

  const communities = data?.pages.map((p) => p.communities).flat();

  return (
    <YStack>
      <XStack>
        <Home />
        <Text>Home</Text>
      </XStack>

      {communities?.map((view) => (
        <Community key={view.community.id} communityView={view} />
      ))}
    </YStack>
  );
}
