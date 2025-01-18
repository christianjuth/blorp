import type { NativeStackHeaderProps } from "@react-navigation/native-stack";
import type { BottomTabHeaderProps } from "@react-navigation/bottom-tabs";
import {
  ComentSortSelect,
  CommunityFilter,
  CommunitySortSelect,
  HomeFilter,
  PostSortSelect,
} from "../lemmy-sort";
import { View, Text, XStack, Input, Avatar, YStack, isWeb } from "tamagui";
import {
  ChevronLeft,
  X,
  User,
  LogOut,
  Bell,
  Settings,
} from "@tamagui/lucide-icons";
import { BlurBackground } from "./blur-background";
import Animated from "react-native-reanimated";
import { useCustomHeaderHeight } from "./hooks";
import { useScrollContext } from "./scroll-animation-context";
import { useMedia } from "tamagui";
import { useAnimatedStyle, interpolate } from "react-native-reanimated";
import { Link, useParams, useRouter } from "one";
import { useState } from "react";
import { useLinkContext } from "./link-context";
import { MagnafineGlass } from "../icons";
import { ContentGutters } from "../gutters";
import { useAuth } from "~/src/stores/auth";
import { HeaderGutters } from "../gutters";
import { useRequireAuth } from "../auth-context";
import { Dropdown } from "../ui/dropdown";
import { useLogout, useNotificationCount } from "~/src/lib/lemmy";
import { useCreatePostStore } from "~/src/stores/create-post";
import { Button } from "../ui/button";
import * as routes from "~/src/lib/routes";

function UserAvatar() {
  const linkCtx = useLinkContext();
  const logout = useLogout();
  const user = useAuth(
    (s) => s.getSelectedAccount().site?.my_user?.local_user_view.person,
  );
  const requireAuth = useRequireAuth();

  if (!user) {
    return (
      <Button bg="$accentColor" br="$12" size="$3" onPress={requireAuth}>
        Login
      </Button>
    );
  }

  return (
    <Dropdown
      placement="bottom-end"
      trigger={
        <Avatar size={30}>
          <Avatar.Image src={user.avatar} borderRadius="$12" />
          <Avatar.Fallback
            backgroundColor="$color8"
            borderRadius="$12"
            ai="center"
            jc="center"
          >
            <Text fontSize="$1">
              {user.name?.substring(0, 1).toUpperCase()}
            </Text>
          </Avatar.Fallback>
        </Avatar>
      }
    >
      <YStack minWidth={200}>
        <YStack ai="center" bbw={1} bbc="$color6" py="$2.5" gap="$2">
          <Avatar size="$5">
            <Avatar.Image src={user.avatar} borderRadius="$12" />
            <Avatar.Fallback
              backgroundColor="$color8"
              borderRadius={99999}
              ai="center"
              jc="center"
            >
              <Text fontSize="$5">
                {user.name?.substring(0, 1).toUpperCase()}
              </Text>
            </Avatar.Fallback>
          </Avatar>
          <Text fontSize="$4">u/{user.name}</Text>
        </YStack>

        <YStack py="$1.5">
          <Dropdown.Close>
            <Link href={`${linkCtx.root}u/${user.id}`} push asChild>
              <XStack h="$3" tag="a" ai="center" px="$2.5" gap="$2.5">
                <User size="$1" col="$color10" />
                <Text>Profile</Text>
              </XStack>
            </Link>
          </Dropdown.Close>

          <Dropdown.Close>
            <Link href={routes.settings} push asChild>
              <XStack h="$3" tag="a" ai="center" px="$2.5" gap="$2.5">
                <Settings size="$1" col="$color10" />
                <Text>Settings</Text>
              </XStack>
            </Link>
          </Dropdown.Close>

          <Dropdown.Close>
            <Button onPress={logout} asChild>
              <XStack
                h="$3"
                ai="center"
                px="$2.5"
                gap="$2.5"
                bg="transparent"
                tag="button"
                bw={0}
              >
                <LogOut size="$1" col="$color10" />
                <Text>Logout</Text>
              </XStack>
            </Button>
          </Dropdown.Close>
        </YStack>
      </YStack>
    </Dropdown>
  );
}

function NotificationsBell() {
  const notificationCount = useNotificationCount();
  const isLoggedIn = useAuth((s) => s.isLoggedIn());
  if (!isLoggedIn) {
    return null;
  }
  return (
    <Link href="/inbox" asChild>
      <View pos="relative" tag="a" $md={{ dsp: "none" }}>
        <Bell col="$accentColor" />
        {notificationCount > 0 && (
          <YStack
            bg="$background"
            pos="absolute"
            t={-5}
            r={-9}
            h={20}
            w={20}
            ai="center"
            jc="center"
            br={9999}
          >
            <YStack ai="center" jc="center" h={16} w={16} bg="red" br={9999}>
              <Text color="white" fontSize={11}>
                {notificationCount}
              </Text>
            </YStack>
          </YStack>
        )}
      </View>
    </Link>
  );
}

function NavbarRightSide({ children }: { children?: React.ReactNode }) {
  return (
    <>
      {children}
      <NotificationsBell />
      <UserAvatar />
    </>
  );
}

function SearchBar({ defaultValue }: { defaultValue?: string }) {
  const linkCtx = useLinkContext();
  const router = useRouter();
  const [search, setSearch] = useState(defaultValue ?? "");
  return (
    <Input
      bg="$color4"
      bw={0}
      $gtMd={{
        opacity: 0.7,
      }}
      $md={{
        dsp: "none",
      }}
      br="$12"
      h="$3"
      bc="$color4"
      placeholder={`Search`}
      flex={1}
      value={search}
      onChangeText={setSearch}
      onSubmitEditing={() => {
        if (linkCtx.root !== "/inbox/") {
          router.push(`${linkCtx.root}s/test`);
        }
      }}
    />
  );
}

export function useHeaderAnimation() {
  const { scrollY } = useScrollContext();
  const header = useCustomHeaderHeight();
  const media = useMedia();

  // Animated style for the header
  const container = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, 1],
      [0, -1 * (header.height - header.insetTop)],
      "clamp",
    );
    return {
      transform: [{ translateY: media.gtMd ? 0 : translateY }],
    };
  }, [scrollY, header.height, header.insetTop, media.gtMd]);

  const content = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, 1], [1, 0], "clamp");
    return {
      opacity: media.gtMd ? 1 : opacity,
    };
  }, [scrollY, media.gtMd]);

  return {
    container,
    content,
  };
}

export function HomeHeader(
  props: NativeStackHeaderProps | BottomTabHeaderProps,
) {
  const linkCtx = useLinkContext();

  const styles = useHeaderAnimation();
  const { height, insetTop } = useCustomHeaderHeight();

  return (
    <Animated.View style={[styles.container, { position: "relative" }]}>
      <BlurBackground />

      <Animated.View style={styles.content}>
        <View bbc="$color4" bbw={0.5} w="100%">
          <HeaderGutters
            ai="center"
            pt={insetTop}
            h={height - 1}
            pos="relative"
            px="$3"
            jc="space-between"
          >
            <HomeFilter />
            <SearchBar />
            <NavbarRightSide>
              <PostSortSelect />
            </NavbarRightSide>
          </HeaderGutters>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

export function CommunityHeader(
  props: NativeStackHeaderProps | BottomTabHeaderProps,
) {
  const linkCtx = useLinkContext();

  const router = useRouter();
  const styles = useHeaderAnimation();

  const params = props.route.params;
  const communityName =
    params &&
    "communityName" in params &&
    typeof params.communityName === "string"
      ? params.communityName
      : undefined;

  const initSearch =
    params && "search" in params && typeof params.search === "string"
      ? params.search
      : undefined;

  const { height, insetTop } = useCustomHeaderHeight();

  const [search, setSearch] = useState(initSearch);

  return (
    <View bbc="$color4" bbw={0.5} w="100%" pos="relative">
      <BlurBackground />

      <HeaderGutters pt={insetTop} h={height - 1}>
        <>
          {"back" in props && props.back && (
            <Button
              unstyled
              p={2}
              bg="transparent"
              borderRadius="$12"
              dsp="flex"
              fd="row"
              ai="center"
              bw={0}
              onPress={() => props.navigation.pop(1)}
              h="auto"
            >
              <ChevronLeft color="$accentColor" size="$2" />
            </Button>
          )}
        </>

        <Input
          bg="$color4"
          br="$12"
          h="$3"
          bc="$color4"
          placeholder={`Search ${communityName}`}
          flex={1}
          maxWidth={500}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => {
            router.push(`${linkCtx.root}c/${communityName}/s/${search}`);
          }}
        />

        <NavbarRightSide>
          <PostSortSelect />
        </NavbarRightSide>
      </HeaderGutters>
    </View>
  );
}

export function SearchHeader(
  props: NativeStackHeaderProps | BottomTabHeaderProps,
) {
  const linkCtx = useLinkContext();

  const router = useRouter();
  const styles = useHeaderAnimation();

  const params = props.route.params;
  const communityName =
    params &&
    "communityName" in params &&
    typeof params.communityName === "string"
      ? params.communityName
      : undefined;

  const initSearch =
    params && "search" in params && typeof params.search === "string"
      ? params.search
      : undefined;

  const { height, insetTop } = useCustomHeaderHeight();

  return (
    <View bbc="$color4" bbw={0.5} w="100%" pos="relative">
      <BlurBackground />

      <HeaderGutters pt={insetTop} h={height - 1}>
        <>
          {"back" in props && props.back && (
            <Button
              unstyled
              p={0}
              bg="transparent"
              borderRadius="$12"
              dsp="flex"
              fd="row"
              ai="center"
              bw={0}
              onPress={() => props.navigation.pop(1)}
              h="auto"
            >
              <ChevronLeft color="$accentColor" size="$1.5" />
            </Button>
          )}
        </>
        <SearchBar defaultValue={initSearch} />
        <NavbarRightSide>
          <PostSortSelect />
        </NavbarRightSide>
      </HeaderGutters>
    </View>
  );
}

export function CommunitiesHeader(
  props: NativeStackHeaderProps | BottomTabHeaderProps,
) {
  const { height, insetTop } = useCustomHeaderHeight();
  return (
    <View bbc="$color4" bbw={0.5} w="100%" pos="relative">
      <BlurBackground />
      <HeaderGutters pt={insetTop} h={height - 1}>
        <>
          {"back" in props && props.back && (
            <Button
              unstyled
              p={2}
              bg="transparent"
              borderRadius="$12"
              dsp="flex"
              fd="row"
              ai="center"
              bw={0}
              onPress={() => props.navigation.pop(1)}
              h="auto"
            >
              <ChevronLeft color="$accentColor" size="$2" />
            </Button>
          )}
        </>
        <CommunityFilter />
        <NavbarRightSide>
          <CommunitySortSelect />
        </NavbarRightSide>
      </HeaderGutters>
    </View>
  );
}

export function UserHeader(
  props: NativeStackHeaderProps | BottomTabHeaderProps,
) {
  const { height, insetTop } = useCustomHeaderHeight();
  return (
    <View bbc="$color4" bbw={0.5} w="100%" pos="relative">
      <BlurBackground />
      <HeaderGutters pt={insetTop} h={height - 1}>
        <>
          {"back" in props && props.back && (
            <Button
              unstyled
              p={2}
              bg="transparent"
              borderRadius="$12"
              dsp="flex"
              fd="row"
              ai="center"
              bw={0}
              onPress={() => props.navigation.pop(1)}
              h="auto"
            >
              <ChevronLeft color="$accentColor" size="$2" />
            </Button>
          )}
        </>
        <Text fontWeight="bold" fontSize="$5" overflow="hidden" pos="relative">
          {props.options.title}
        </Text>
        <NavbarRightSide>
          <PostSortSelect />
        </NavbarRightSide>
      </HeaderGutters>
    </View>
  );
}

export function PostHeader(
  props: NativeStackHeaderProps | BottomTabHeaderProps,
) {
  const params = props.route.params;
  const communityName =
    params &&
    "communityName" in params &&
    typeof params.communityName === "string"
      ? params.communityName
      : undefined;

  const { height, insetTop } = useCustomHeaderHeight();
  return (
    <View bbc="$color4" bbw={0.5} w="100%" pos="relative">
      <BlurBackground />
      <HeaderGutters pt={insetTop} h={height - 1}>
        <>
          {"back" in props && props.back && (
            <Button
              unstyled
              p={2}
              bg="transparent"
              borderRadius="$12"
              dsp="flex"
              fd="row"
              ai="center"
              bw={0}
              onPress={() => props.navigation.pop(1)}
              h="auto"
            >
              <ChevronLeft color="$accentColor" size="$2" />
            </Button>
          )}
        </>
        <Text
          fontWeight="bold"
          fontSize="$5"
          overflow="hidden"
          pos="relative"
          numberOfLines={1}
        >
          {communityName}
        </Text>
        <NavbarRightSide>
          <ComentSortSelect />
        </NavbarRightSide>
      </HeaderGutters>
    </View>
  );
}

export function ModalHeader(props: NativeStackHeaderProps) {
  const { height, insetTop } = useCustomHeaderHeight();
  return (
    <XStack
      bg="$background"
      bbc="$color4"
      bbw={1}
      btw={0}
      btc="transparent"
      w="unset"
      px="$3"
      ai="center"
      pt={insetTop}
      h={height - 1}
    >
      <View flex={1} flexBasis={0} ai="flex-start">
        {props.back && (
          <Button
            unstyled
            p={0}
            bg="transparent"
            dsp="flex"
            fd="row"
            ai="center"
            bw={0}
            onPress={props.navigation.goBack}
            h="auto"
          >
            <X color="$accentColor" />
          </Button>
        )}
      </View>
      <Text fontWeight="bold" fontSize="$5" overflow="hidden">
        {props.options.title}
      </Text>
      <View flex={1} flexBasis={0} ai="flex-end"></View>
    </XStack>
  );
}

export function StackHeader(props: NativeStackHeaderProps) {
  const { height, insetTop } = useCustomHeaderHeight();
  return (
    <View bbc="$color4" bbw={0.5} w="100%" pos="relative">
      <BlurBackground />

      <HeaderGutters pt={insetTop} h={height - 1}>
        <>
          {"back" in props && props.back && (
            <Button
              unstyled
              p={2}
              bg="transparent"
              borderRadius="$12"
              dsp="flex"
              fd="row"
              ai="center"
              bw={0}
              onPress={() => props.navigation.pop(1)}
              h="auto"
            >
              <ChevronLeft color="$accentColor" size="$2" />
            </Button>
          )}
        </>

        <Text fontWeight="bold" fontSize="$5" overflow="hidden" pos="relative">
          {props.options.title ?? props.route.name}
        </Text>

        <NavbarRightSide />
      </HeaderGutters>
    </View>
  );
}

export function BottomTabBarHeader(props: BottomTabHeaderProps) {
  const { height, insetTop } = useCustomHeaderHeight();
  return (
    <View bbc="$color4" bbw={0.5} w="100%" pos="relative">
      <BlurBackground />
      <HeaderGutters pt={insetTop} h={height - 1}>
        <>
          {props.navigation.canGoBack() && (
            <Button
              unstyled
              p={2}
              bg="transparent"
              borderRadius="$12"
              dsp="flex"
              fd="row"
              ai="center"
              bw={0}
              onPress={() => props.navigation.goBack()}
              h="auto"
            >
              <ChevronLeft color="$accentColor" size="$2" />
            </Button>
          )}
        </>
        <Text fontWeight="bold" fontSize="$5" overflow="hidden" pos="relative">
          {props.options.title ?? props.route.name}
        </Text>
        <></>
      </HeaderGutters>
    </View>
  );
}

export function CreatePostHeaderStepOne(props: BottomTabHeaderProps) {
  const router = useRouter();
  const { height, insetTop } = useCustomHeaderHeight();

  const selectedCommunity = useCreatePostStore((s) => s.community);
  const isPostReady = useCreatePostStore(
    (s) => s.community && s.title.length > 0 && s.content.length > 0,
  );
  const reset = useCreatePostStore((s) => s.reset);

  return (
    <View bbc="$color4" bbw={0.5} w="100%" pos="relative">
      <BlurBackground />
      <HeaderGutters pt={insetTop} h={height - 1}>
        <>
          {props.navigation.canGoBack() && (
            <Button
              unstyled
              p={2}
              bg="transparent"
              borderRadius="$12"
              dsp="flex"
              fd="row"
              ai="center"
              bw={0}
              onPress={() => props.navigation.goBack()}
              h="auto"
            >
              <X color="$accentColor" size="$2" />
            </Button>
          )}
        </>
        <Text fontWeight="bold" fontSize="$5" overflow="hidden" pos="relative">
          {props.options.title ?? props.route.name}
        </Text>
        {selectedCommunity ? (
          <Button
            bg={isPostReady ? "$accentColor" : "$color4"}
            br="$12"
            size="$3"
            onPress={() => {
              reset();
              router.replace("/");
            }}
            disabled={!isPostReady}
          >
            Post
          </Button>
        ) : (
          // Web seems to erase stack history on page reload,
          // so replace works better on web, but on native
          // it negativly impacts the modal animation
          // so we replace on web and push on native
          <Link href="/create/choose-community" asChild replace={isWeb}>
            <Button bg="$accentColor" br="$12" size="$3">
              Next
            </Button>
          </Link>
        )}
      </HeaderGutters>
    </View>
  );
}

export function CreatePostHeaderStepTwo(props: BottomTabHeaderProps) {
  const { height, insetTop } = useCustomHeaderHeight();
  const router = useRouter();
  return (
    <View bbc="$color4" bbw={0.5} w="100%" pos="relative">
      <BlurBackground />
      <HeaderGutters pt={insetTop} h={height - 1}>
        <>
          {props.navigation.canGoBack() && (
            <Button
              unstyled
              p={2}
              bg="transparent"
              borderRadius="$12"
              dsp="flex"
              fd="row"
              ai="center"
              bw={0}
              onPress={() => {
                // Web seems to erase stack history on page reload,
                // so replace works better on web, but on native
                // it negativly impacts the modal animation
                // so we replace on web and pop on native
                if (isWeb) {
                  router.replace("/create");
                } else {
                  props.navigation.goBack();
                }
              }}
              h="auto"
            >
              <X color="$accentColor" size="$2" />
            </Button>
          )}
        </>
        <Text fontWeight="bold" fontSize="$5" overflow="hidden" pos="relative">
          {props.options.title ?? props.route.name}
        </Text>
      </HeaderGutters>
    </View>
  );
}
