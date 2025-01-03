import type { NativeStackHeaderProps } from "@react-navigation/native-stack";
import type { BottomTabHeaderProps } from "@react-navigation/bottom-tabs";
import {
  ComentSortSelect,
  CommunityFilter,
  CommunitySortSelect,
  HomeFilter,
  PostSortSelect,
} from "../lemmy-sort";
import { View, Text, Button, XStack, Input, Avatar } from "tamagui";
import { ChevronLeft, X } from "@tamagui/lucide-icons";
import { BlurBackground } from "./blur-background";
import Animated from "react-native-reanimated";
import { useCustomHeaderHeight } from "./hooks";
import { useScrollContext } from "./scroll-animation-context";
import { useMedia } from "tamagui";
import { useAnimatedStyle, interpolate } from "react-native-reanimated";
import { Link, useRouter } from "one";
import { useState } from "react";
import { useLinkContext } from "./link-context";
import { MagnafineGlass } from "../icons";
import { ContentGutters } from "../gutters";
import { useAuth } from "~/src/stores/auth";
import { HeaderGutters } from "../gutters";

function UserAvatar() {
  const user = useAuth((s) => s.site?.my_user?.local_user_view.person);

  if (!user) {
    return null;
  }

  return (
    <Avatar size={25}>
      <Avatar.Image src={user.avatar} borderRadius="$12" />
      <Avatar.Fallback
        backgroundColor="$color8"
        borderRadius="$12"
        ai="center"
        jc="center"
      >
        <Text fontSize="$1">{user.name?.substring(0, 1).toUpperCase()}</Text>
      </Avatar.Fallback>
    </Avatar>
  );
}

function SearchBar() {
  const linkCtx = useLinkContext();
  const router = useRouter();
  const [search, setSearch] = useState("");
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
        router.push(`${linkCtx.root}s/${search}`);
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
              <HomeFilter />
            </>
            <SearchBar />
            <>
              {/* <Link href={`${linkCtx.root}s/q`}> */}
              {/*   <MagnafineGlass /> */}
              {/* </Link> */}
              <PostSortSelect />
              <UserAvatar />
            </>
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
    <Animated.View style={[styles.container, { position: "relative" }]}>
      <BlurBackground />

      <Animated.View style={styles.content}>
        <View bbc="$color4" bbw={0.5} w="100%">
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

            <>
              <PostSortSelect />
              <UserAvatar />
            </>
          </HeaderGutters>
        </View>
      </Animated.View>
    </Animated.View>
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

  const [search, setSearch] = useState(initSearch);

  return (
    <Animated.View style={[styles.container, { position: "relative" }]}>
      <BlurBackground />

      <Animated.View style={styles.content}>
        <View bbc="$color4" bbw={0.5} w="100%">
          <ContentGutters
            ai="center"
            pt={insetTop}
            h={height - 1}
            pos="relative"
            // flex={1}
            fd="row"
            px="$3"
            gap="$2.5"
            jc="space-between"
          >
            <>
              <View w="33%">
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
              </View>
              <SearchBar />
              <XStack w="33%" jc="flex-end" ai="center" gap="$3">
                {/* <Link href={`${linkCtx.root}s/q`}> */}
                {/*   <MagnafineGlass /> */}
                {/* </Link> */}
                <PostSortSelect />
                <UserAvatar />
              </XStack>
            </>
          </ContentGutters>
        </View>
      </Animated.View>
    </Animated.View>
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
        <CommunitySortSelect />
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
        <Text fontWeight="bold" fontSize="$5" overflow="hidden" pos="relative">
          {communityName}
        </Text>
        <ComentSortSelect />
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
    <XStack
      bbc="$color4"
      bbw={0.5}
      btw={0}
      btc="transparent"
      w="unset"
      px="$3"
      ai="center"
      pt={insetTop}
      h={height - 1}
      pos="relative"
    >
      <BlurBackground />

      <View flex={1} flexBasis={0} ai="flex-start">
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
      </View>
      <Text fontWeight="bold" fontSize="$5" overflow="hidden" pos="relative">
        {props.options.headerTitle ?? props.route.name}
      </Text>
      <View flex={1} flexBasis={0} ai="flex-end"></View>
    </XStack>
  );
}

export function BottomTabBarHeader(props: BottomTabHeaderProps) {
  const { height, insetTop } = useCustomHeaderHeight();
  return (
    <XStack
      bbc="$color4"
      bbw={0.5}
      btw={0}
      btc="transparent"
      w="unset"
      px="$3"
      ai="center"
      pt={insetTop}
      h={height - 1}
      pos="relative"
    >
      <BlurBackground />

      <View flex={1} flexBasis={0} ai="flex-start">
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
      </View>
      <Text fontWeight="bold" fontSize="$5" overflow="hidden" pos="relative">
        {props.route.name}
      </Text>
      <View flex={1} flexBasis={0} ai="flex-end">
        <ComentSortSelect />
      </View>
    </XStack>
  );
}
