import { XStack, YStack, Text, View, Avatar } from "tamagui";
import { Home, Users } from "@tamagui/lucide-icons";
import { Link } from "one";
import * as routes from "~/src/lib/routes";
import { useRecentCommunities } from "../stores/recent-communities";
import { Community } from "lemmy-js-client";

function SmallComunityCard({
  community,
}: {
  community: Pick<Community, "icon" | "title" | "name" | "id">;
}) {
  return (
    <Link href={`/c/${community.id}`} key={community.id} asChild replace>
      <XStack ai="center" gap="$2" tag="a">
        <Avatar size="$2.5" borderRadius="$12">
          <Avatar.Image src={community.icon} />
          <Avatar.Fallback
            backgroundColor="$color8"
            borderRadius="$12"
            ai="center"
            jc="center"
          >
            <Text fontSize="$4">{community.title.substring(0, 1)}</Text>
          </Avatar.Fallback>
        </Avatar>
        <Text fontSize="$3.5">c/{community.name}</Text>
      </XStack>
    </Link>
  );
}

export function Sidebar() {
  const communities = useRecentCommunities((s) => s.recentlyVisited);

  return (
    <YStack gap="$3" py="$2">
      <Link href={routes.home}>
        <XStack ai="center" gap="$2">
          <Home />
          <Text>Home</Text>
        </XStack>
      </Link>

      <Link href={routes.communities}>
        <XStack ai="center" gap="$2">
          <Users />
          <Text>Communities</Text>
        </XStack>
      </Link>

      <View h={1} flex={1} bg="$color4" my="$2" />

      <Text color="$color10" fontSize="$3">
        RECENT
      </Text>
      {communities.map((c) => (
        <SmallComunityCard key={c.id} community={c} />
      ))}
    </YStack>
  );
}
