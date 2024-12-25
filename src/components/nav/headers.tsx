import type { NativeStackHeaderProps } from "@react-navigation/native-stack";
import type { BottomTabHeaderProps } from "@react-navigation/bottom-tabs";
import {
  ComentSortSelect,
  CommunityFilter,
  CommunitySortSelect,
  HomeFilter,
  PostSortSelect,
} from "../lemmy-sort";
import { View, Text, Button, XStack } from "tamagui";
import { ChevronLeft, X } from "@tamagui/lucide-icons";
import { BlurBackground } from "./blur-background";
import Animated from "react-native-reanimated";
import { useCustomHeaderHeight } from "./hooks";
import { useScrollContext } from "./scroll-animation-context";
import { useMedia } from "tamagui";
import { useAnimatedStyle, interpolate } from "react-native-reanimated";

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
  const styles = useHeaderAnimation();
  const { height, insetTop } = useCustomHeaderHeight();

  return (
    <Animated.View style={[styles.container, { position: "relative" }]}>
      <BlurBackground />

      <Animated.View style={styles.content}>
        <XStack
          bbc="$color4"
          bbw={0.5}
          w="unset"
          px="$3"
          ai="center"
          pt={insetTop}
          h={height - 1}
          pos="relative"
        >
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
                <ChevronLeft color="$color1" size="$2" />
              </Button>
            )}
          </View>
          <HomeFilter />
          <View flex={1} flexBasis={0} ai="flex-end">
            <PostSortSelect />
          </View>
        </XStack>
      </Animated.View>
    </Animated.View>
  );
}

export function CommunityHeader(
  props: NativeStackHeaderProps | BottomTabHeaderProps,
) {
  const styles = useHeaderAnimation();

  const params = props.route.params;
  const communityName =
    params &&
    "communityName" in params &&
    typeof params.communityName === "string"
      ? params.communityName
      : undefined;
  const { height, insetTop } = useCustomHeaderHeight();

  return (
    <Animated.View style={[styles.container, { position: "relative" }]}>
      <BlurBackground />

      <Animated.View style={styles.content}>
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
          gap="$2"
          jc="space-between"
        >
          <View ai="flex-start">
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

          <Text
            fontWeight="bold"
            fontSize="$5"
            numberOfLines={1}
            textOverflow="ellipsis"
            flex={1}
            textAlign="center"
          >
            {communityName ?? "Home"}
          </Text>
          <View ai="flex-end">
            <PostSortSelect />
          </View>
        </XStack>
      </Animated.View>
    </Animated.View>
  );
}

export function CommunitysHeader(
  props: NativeStackHeaderProps | BottomTabHeaderProps,
) {
  const styles = useHeaderAnimation();
  const { height, insetTop } = useCustomHeaderHeight();
  return (
    <Animated.View style={[styles.container, { position: "relative" }]}>
      <BlurBackground />

      <Animated.View style={styles.content}>
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
        >
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
          <CommunityFilter />
          <View flex={1} flexBasis={0} ai="flex-end">
            <CommunitySortSelect />
          </View>
        </XStack>
      </Animated.View>
    </Animated.View>
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
        {communityName}
      </Text>
      <View flex={1} flexBasis={0} ai="flex-end">
        <ComentSortSelect />
      </View>
    </XStack>
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
        {props.route.name}
      </Text>
      <View flex={1} flexBasis={0} ai="flex-end">
        <ComentSortSelect />
      </View>
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
