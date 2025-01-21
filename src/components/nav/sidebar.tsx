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
import { getLabel, MissingIcon } from "@react-navigation/elements";

function SmallComunityCard({
  community,
}: {
  community: Pick<Community, "icon" | "title" | "name" | "id" | "actor_id">;
}) {
  const slug = createCommunitySlug(community);
  return (
    <Link href={`/c/${slug}`} key={community.id} asChild replace>
      <XStack ai="center" gap="$2.5" tag="a" py="$1" px="$3">
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

const SIDEBAR_HIDDEN_ROUTES = ["create"];

// function TabItem() {
// }

export function Sidebar(props: BottomTabBarProps | {}) {
  const recentCommunities = useRecentCommunities((s) => s.recentlyVisited);
  const header = useCustomHeaderHeight();
  const themeName = useThemeName();
  const isLoggedIn = useAuth((s) => s.isLoggedIn());

  const subscribedCommunities = useListCommunities({
    type_: "Subscribed",
    limit: 20,
  });

  return (
    <>
      <Link href="/" asChild>
        <YStack h={header.height} px="$5" jc="center" tag="a">
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
      </Link>

      <YStack gap="$1" py="$2" px="$3">
        {"state" in props &&
          props.state?.routes.map((route, index) => {
            if (SIDEBAR_HIDDEN_ROUTES.includes(route.name)) {
              return null;
            }

            const focused = index === props.state.index;

            const { options } = props.descriptors[route.key];

            const onPress = () => {
              const event = props.navigation.emit({
                type: "tabPress",
                target: route.state?.key,
                canPreventDefault: true,
              });

              const focused = false;

              if (!focused && !event.defaultPrevented) {
                props.navigation.dispatch({
                  ...CommonActions.navigate(route),
                  target: route.state?.key,
                });
              }
            };

            const label =
              typeof options.tabBarLabel === "function"
                ? options.tabBarLabel
                : getLabel(
                    { label: options.tabBarLabel, title: options.title },
                    route.name,
                  );

            return (
              <XStack
                ai="center"
                gap="$2.5"
                onPress={onPress}
                tag="button"
                bg={focused ? "$color4" : undefined}
                py="$2"
                px="$3"
                br="$5"
                hoverStyle={
                  !focused
                    ? {
                        bg: "$color2",
                      }
                    : undefined
                }
              >
                {options.tabBarIcon?.({
                  focused: true,
                  size: 10,
                  color: options.tabBarActiveTintColor ?? "red",
                }) ?? <MissingIcon />}
                {/* <Home color="$color11" /> */}
                <Text color="$color11">{label}</Text>
              </XStack>
            );
          })}

        <View h={1} flex={1} bg="$color4" my="$2" />

        {recentCommunities.length > 0 && (
          <>
            <Text color="$color10" fontSize="$3" px="$3" py="$1">
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
            <Text color="$color10" fontSize="$3" px="$3" py="$1">
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
          <Text color="$color11" tag="a" px="$3">
            Privacy Policy
          </Text>
        </Link>
      </YStack>

      <View h="$1" />
    </>
  );
}
