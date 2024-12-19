import { BottomTabBarProps, BottomTabBar } from "@react-navigation/bottom-tabs";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMedia } from "tamagui";
import { useScrollContext } from "./scroll-animation-context";
import { interpolate, useAnimatedStyle } from "react-native-reanimated";
import Animated from "react-native-reanimated";
import { BlurBackground } from "./blur-background";

export const useCustomTabBarHeight = () => {
  const insets = useSafeAreaInsets();

  // Default header heights based on platform
  const defaultHeaderHeight = Platform.select({
    ios: 45, // Default header height on iOS
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

  const isLgScreen = useMedia().gtSm;

  return (
    <Animated.View
      style={[
        container,
        {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          display: isLgScreen ? "none" : undefined,
        },
      ]}
    >
      <BlurBackground />
      <Animated.View style={content}>
        <BottomTabBar {...props} />
      </Animated.View>
    </Animated.View>
  );
}
