import { BottomTabBarProps, BottomTabBar } from "@react-navigation/bottom-tabs";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { isWeb, ScrollView, useMedia } from "tamagui";
import { useScrollContext } from "./scroll-animation-context";
import {
  interpolate,
  useAnimatedStyle,
  useEvent,
} from "react-native-reanimated";
import Animated from "react-native-reanimated";
import { BlurBackground } from "./blur-background";
import { Sidebar } from "./sidebar";
import { SafeAreaView, useRouter } from "one";
import { useNavigationState, useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";

export const useCustomTabBarHeight = () => {
  const insets = useSafeAreaInsets();

  // Default header heights based on platform
  const defaultHeaderHeight = Platform.select({
    ios: 49, // Default header height on iOS
    android: 56, // Default header height on Android
    default: 65, // Default header height for web or other platforms
  });

  // Add safe area top inset to ensure the header accounts for the status bar
  const height = defaultHeaderHeight + insets.bottom;
  return {
    height,
    insetBottom: insets.bottom,
  };
};

export function CustomBottomTabBar(props: BottomTabBarProps) {
  const { scrollY } = useScrollContext();
  const tabBar = useCustomTabBarHeight();

  const tabIndex = props.state.index;
  const route = props.state.routes[tabIndex].state;
  const topScreenInStack = route?.routes?.at(-1);

  const tabBarHideable = tabIndex === 0 && topScreenInStack?.name === "index";

  // Animated style for the header
  const container = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, 1],
      [0, tabBar.height],
      "clamp",
    );
    return {
      transform: [{ translateY }],
    };
  }, [scrollY, tabBar.height]);

  const content = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, 1], [1, 0], "clamp");
    return {
      opacity,
    };
  }, [scrollY]);

  const isLgScreen = useMedia().gtMd;

  if (isLgScreen) {
    return (
      <ScrollView maxWidth={270} brw={1} bc="$color4">
        <SafeAreaView>
          <Sidebar {...props} />
        </SafeAreaView>
      </ScrollView>
    );
  }

  return (
    <Animated.View
      style={[
        container,
        tabBarHideable && !isWeb
          ? {
              position: "absolute",
              right: 0,
              bottom: 0,
              left: 0,
            }
          : undefined,
      ]}
    >
      <BlurBackground />
      <Animated.View style={content}>
        <BottomTabBar {...props} />
      </Animated.View>
    </Animated.View>
  );
}
