import type { NativeStackHeaderProps } from "@react-navigation/native-stack";
import type { BottomTabHeaderProps } from "@react-navigation/bottom-tabs";
import { ComentSortSelect, PostSortSelect } from "./lemmy-sort";
import { View, Text, Button, XStack } from "tamagui";
import { ChevronLeft, X } from "@tamagui/lucide-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";

const useCustomHeaderHeight = () => {
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

export function PostHeader(props: NativeStackHeaderProps) {
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
      <Text fontWeight="bold" fontSize="$5">
        {props.options.title ?? "Post"}
      </Text>
      <View flex={1} flexBasis={0} ai="flex-end">
        <ComentSortSelect />
      </View>
    </XStack>
  );
}

export function CommunityHeader(
  props: NativeStackHeaderProps | BottomTabHeaderProps,
) {
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
        {"back" in props && (
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
            <>
              <ChevronLeft color="$accentColor" />
              <Text fontSize="$5" color="$accentColor">
                {props.back?.title}
              </Text>
            </>
          </Button>
        )}
      </View>
      <Text fontWeight="bold" fontSize="$5">
        {props.options.title ?? "Home"}
      </Text>
      <View flex={1} flexBasis={0} ai="flex-end">
        <PostSortSelect />
      </View>
    </XStack>
  );
}
