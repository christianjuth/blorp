import { YStack } from "tamagui";
import { useListCommunities } from "~/src/lib/lemmy";
import { Community } from "./community";

export function Sidebar() {
  const { data } = useListCommunities({
    limit: 30,
    sort: "TopDay",
  });

  const communities = data?.pages.map((p) => p.communities).flat();

  return (
    <YStack>
      {communities?.map((view) => (
        <Community key={view.community.id} communityView={view} />
      ))}
    </YStack>
  );
}
