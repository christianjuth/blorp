import type { NativeStackHeaderProps } from "@react-navigation/native-stack";
import type { BottomTabHeaderProps } from "@react-navigation/bottom-tabs";
import { ComentSortSelect, HomeFilter, PostSortSelect } from "./lemmy-sort";
import { View, Text, Button, XStack } from "tamagui";
import { ChevronLeft, X } from "@tamagui/lucide-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";
import { BlurBackground } from "./nav/blur-background";
import { useScrollContext } from "./providers";
import Animated, {
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";

export const useCustomHeaderHeight = () => {
  const insets = useSafeAreaInsets();

  // Default header heights based on platform
  const defaultHeaderHeight = Platform.select({
    ios: 40, // Default header height on iOS
    android: 56, // Default header height on Android
    default: 65, // Default header height for web or other platforms
  });

  // Add safe area top inset to ensure the header accounts for the status bar
  const height = defaultHeaderHeight + insets.top;
  return {
    height,
    insetTop: insets.top,
  };
};

const HEADER_HEIGHT = 60;

function useHeaderAnimation() {
  const { scrollY } = useScrollContext();
  const header = useCustomHeaderHeight();

  // Animated style for the header
  const container = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, 1],
      [0, -1 * (header.height - header.insetTop)],
      "clamp",
    );
    return {
      transform: [{ translateY }],
    };
  });

  const content = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, 1], [1, 0], "clamp");
    return {
      opacity,
    };
  });

  return {
    container,
    content,
  };
}

// export function PostHeader(props: NativeStackHeaderProps) {
//   const { height, insetTop } = useCustomHeaderHeight();
//   return (
//     <XStack
//       bg="$color1"
//       bbc="$color4"
//       bbw={1}
//       btw={0}
//       btc="transparent"
//       w="unset"
//       px="$3"
//       ai="center"
//       pt={insetTop}
//       h={height - 1}
//     >
//       <View flex={1} flexBasis={0} ai="flex-start">
//         {props.back && (
//           <Button
//             unstyled
//             p={0}
//             bg="transparent"
//             dsp="flex"
//             fd="row"
//             ai="center"
//             bw={0}
//             onPress={props.navigation.goBack}
//             h="auto"
//           >
//             <X color="$accentColor" />
//           </Button>
//         )}
//       </View>
//       <Text fontWeight="bold" fontSize="$5" overflow="hidden">
//         {props.options.title ?? "Post"}
//       </Text>
//       <View flex={1} flexBasis={0} ai="flex-end">
//         <ComentSortSelect />
//       </View>
//     </XStack>
//   );
// }

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
          btw={0}
          btc="transparent"
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
                bg="$color075"
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
        {communityName ?? "Home"}
      </Text>
      <View flex={1} flexBasis={0} ai="flex-end">
        <PostSortSelect />
      </View>
    </XStack>
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
      bg="$color1"
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
