import { XStack, YStack, Text, View, Avatar, useThemeName } from "tamagui";
import { Link, useRouter } from "one";
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
import {
  CommonActions,
  NavigationContext,
  NavigationRouteContext,
} from "@react-navigation/native";
import { getLabel, MissingIcon } from "@react-navigation/elements";
import _ from "lodash";
import { scale } from "~/config/tamagui/scale";

const BC = "$color4";

function SmallComunityCard({
  community,
}: {
  community: Pick<Community, "icon" | "title" | "name" | "id" | "actor_id">;
}) {
  const slug = createCommunitySlug(community);
  return (
    <Link href={`/c/${slug}`} key={community.id} asChild replace>
      <XStack ai="center" gap="$2.5" tag="a" py={3} px="$3">
        <Avatar size="$2.5" borderRadius="$12">
          <Avatar.Image src={community.icon} />
          <Avatar.Fallback
            backgroundColor="$color8"
            borderRadius="$12"
            ai="center"
            jc="center"
          >
            <Text fontSize="$3">{community.title.substring(0, 1)}</Text>
          </Avatar.Fallback>
        </Avatar>
        <Text fontSize="$3">c/{community.name}</Text>
      </XStack>
    </Link>
  );
}

export function Sidebar(props: BottomTabBarProps | {}) {
  const recentCommunities = useRecentCommunities((s) => s.recentlyVisited);
  const header = useCustomHeaderHeight();
  const themeName = useThemeName();
  const isLoggedIn = useAuth((s) => s.isLoggedIn());
  const router = useRouter();

  const subscribedCommunities = useListCommunities({
    type_: "Subscribed",
    limit: 50,
  });

  const sortedCommunities = _.sortBy(
    subscribedCommunities.data?.pages.flatMap((p) => p.communities),
    (c) => c.community.name,
  );

  return (
    <>
      <Link href="/" asChild>
        <YStack h={header.height} px="$5" jc="center" tag="a">
          {themeName === "dark" && (
            <Image
              source={LogoDark}
              style={{ height: 38 * scale, width: 90 * scale }}
              contentFit="contain"
            />
          )}
          {themeName === "light" && (
            <Image
              source={LogoLight}
              style={{ height: 38 * scale, width: 90 * scale }}
              contentFit="contain"
            />
          )}
        </YStack>
      </Link>

      <YStack gap="$1" py="$2" px="$3">
        {"state" in props &&
          props.state?.routes.map((route, index) => {
            const resetOnPress = route.state && route.state.routes.length <= 1;

            const focused = index === props.state.index;
            const { options } = props.descriptors[route.key];

            const onPress = () => {
              if (resetOnPress) {
                let name = route.name;
                if (name === "(home)") {
                  name = "/";
                }
                router.replace(name as any);
                return;
              }

              const event = props.navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!focused && !event.defaultPrevented) {
                props.navigation.dispatch({
                  ...CommonActions.navigate(route),
                  target: props.state.key,
                });
              }
            };

            const onLongPress = () => {
              props.navigation.emit({
                type: "tabLongPress",
                target: route.key,
              });
            };

            const label =
              typeof options.tabBarLabel === "function"
                ? options.tabBarLabel
                : getLabel(
                    { label: options.tabBarLabel, title: options.title },
                    route.name,
                  );

            return (
              <NavigationContext.Provider
                key={route.key}
                value={props.descriptors[route.key].navigation}
              >
                <NavigationRouteContext.Provider value={route}>
                  <XStack
                    ai="center"
                    gap="$2.5"
                    onPress={onPress}
                    onLongPress={onLongPress}
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
                    group
                  >
                    <View>
                      {options.tabBarIcon?.({
                        focused: true,
                        size: 10,
                        color: options.tabBarActiveTintColor ?? "red",
                      }) ?? <MissingIcon />}
                      {options.tabBarBadge && (
                        <YStack
                          bg={focused ? "$color4" : "$background"}
                          $group-hover={{
                            bg: focused ? "$color4" : "$color2",
                          }}
                          pos="absolute"
                          t={-5}
                          r={-9}
                          h={20}
                          w={20}
                          ai="center"
                          jc="center"
                          br={9999}
                        >
                          <YStack
                            ai="center"
                            jc="center"
                            h={16}
                            w={16}
                            bg="red"
                            br={9999}
                          >
                            <Text color="white" fontSize={11}>
                              {options.tabBarBadge}
                            </Text>
                          </YStack>
                        </YStack>
                      )}
                    </View>
                    <Text color="$color11" fontSize="$4">
                      {label}
                    </Text>
                  </XStack>
                </NavigationRouteContext.Provider>
              </NavigationContext.Provider>
            );
          })}

        <View h={1} flex={1} bg="$color4" my="$2" />

        {recentCommunities.length > 0 && (
          <>
            <Text color="$color10" fontSize="$3" px="$3" py="$2">
              RECENT
            </Text>
            {recentCommunities.map((c) => (
              <YStack
                key={c.id}
                br="$5"
                hoverStyle={{
                  bg: "$color2",
                }}
              >
                <SmallComunityCard community={c} />
              </YStack>
            ))}

            <View h={1} flex={1} bg={BC} my="$2" />
          </>
        )}

        {isLoggedIn && sortedCommunities.length > 0 && (
          <>
            <Text color="$color10" fontSize="$3" px="$3" py="$2">
              COMMUNITIES
            </Text>
            {sortedCommunities.map(({ community: c }) => (
              <YStack
                key={c.id}
                br="$5"
                hoverStyle={{
                  bg: "$color2",
                }}
              >
                <SmallComunityCard community={c} />
              </YStack>
            ))}

            <View h={1} flex={1} bg={BC} my="$2" />
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
