import { XStack, YStack, Text, View, Avatar, useThemeName } from "tamagui";
import { Home, Users, Plus, Settings } from "@tamagui/lucide-icons";
import { Link, useNavigation } from "one";
import * as routes from "~/src/lib/routes";
import { useRecentCommunities } from "~/src/stores/recent-communities";
import { Community } from "lemmy-js-client";
import { useListCommunities } from "~/src/lib/lemmy";
import { createCommunitySlug } from "~/src/lib/community";
import { Image } from "expo-image";
import LogoDark from "~/assets/logo-dark.svg";
import LogoLight from "~/assets/logo-light.svg";
import { useCustomHeaderHeight } from "./hooks";
import { useAuth } from "~/src/stores/auth";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { CommonActions } from "@react-navigation/native";

function SmallComunityCard({
  community,
}: {
  community: Pick<Community, "icon" | "title" | "name" | "id" | "actor_id">;
}) {
  const slug = createCommunitySlug(community);
  return (
    <Link href={`/c/${slug}`} key={community.id} asChild replace>
      <XStack ai="center" gap="$2.5" tag="a">
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
        <Text fontSize="$3">c/{community.name}</Text>
      </XStack>
    </Link>
  );
}

// function TabItem() {
// }

export function Sidebar({ config }: { config?: BottomTabBarProps }) {
  const recentCommunities = useRecentCommunities((s) => s.recentlyVisited);
  const header = useCustomHeaderHeight();
  const themeName = useThemeName();
  const isLoggedIn = useAuth((s) => s.isLoggedIn());

  const subscribedCommunities = useListCommunities({
    type_: "Subscribed",
    limit: 20,
  });

  const routeByName = (name: string) => {
    return () => {
      if (!config) {
        return;
      }
      const route = config.state.routes.find((r) => r.name === name);
      if (!route) {
        return;
      }
      const event = config.navigation.emit({
        type: "tabPress",
        target: route.state?.key,
        canPreventDefault: true,
      });

      const focused = false;

      if (!focused && !event.defaultPrevented) {
        config.navigation.dispatch({
          ...CommonActions.navigate(route),
          target: route.state?.key,
        });
      }
    };
  };

  return (
    <>
      <YStack
        h={header.height}
        px="$4"
        jc="center"
        onPress={routeByName("(home)")}
        tag="button"
      >
        {themeName === "dark" && (
          <Image
            source={LogoDark}
            style={{ height: 38, width: 90 }}
            contentFit="contain"
          />
        )}
        {themeName === "light" && (
          <Image
            source={LogoLight}
            style={{ height: 38, width: 90 }}
            contentFit="contain"
          />
        )}
      </YStack>

      <YStack gap="$3" p="$4" py="$2">
        <XStack
          ai="center"
          gap="$2.5"
          onPress={routeByName("(home)")}
          tag="button"
        >
          <Home color="$color11" />
          <Text color="$color11">Feed</Text>
        </XStack>

        <XStack
          ai="center"
          gap="$2.5"
          onPress={routeByName("communities")}
          tag="button"
        >
          <Users color="$color11" />
          <Text color="$color11">Communities</Text>
        </XStack>

        <View h={1} flex={1} bg="$color4" my="$2" />

        {recentCommunities.length > 0 && (
          <>
            <Text color="$color10" fontSize="$3">
              RECENT
            </Text>
            {recentCommunities.map((c) => (
              <SmallComunityCard key={c.id} community={c} />
            ))}

            <View h={1} flex={1} bg="$color4" my="$2" />
          </>
        )}

        {isLoggedIn && (
          <>
            <Text color="$color10" fontSize="$3">
              COMMUNITIES
            </Text>
            {subscribedCommunities.data?.pages
              .flatMap((p) => p.communities)
              .map((c) => (
                <SmallComunityCard
                  key={c.community.id}
                  community={c.community}
                />
              ))}

            <View h={1} flex={1} bg="$color4" my="$2" />
          </>
        )}

        <Link href={routes.privacy} replace asChild>
          <Text color="$color11" tag="a">
            Privacy Policy
          </Text>
        </Link>
      </YStack>

      <View h="$1" />
    </>
  );
}
