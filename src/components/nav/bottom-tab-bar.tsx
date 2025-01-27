import { BottomTabBarProps, BottomTabBar } from "@react-navigation/bottom-tabs";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { isWeb, ScrollView, useMedia, useTheme } from "tamagui";
import { useScrollContext } from "./scroll-animation-context";
import { interpolate, useAnimatedStyle } from "react-native-reanimated";
import Animated from "react-native-reanimated";
import { Sidebar } from "./sidebar";
import { SafeAreaView, useFocusEffect, useNavigation, usePathname } from "one";
import { scale } from "~/config/tamagui/scale";

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

export function useTabBarStyle() {
  const theme = useTheme();
  return {
    backgroundColor: "transparent",
    borderTopColor: theme.color3.val,
    borderTopWidth: 0.5,
  };
}

export function useHideTabBar() {
  const tabBarStyle = useTabBarStyle();
  const navigation = useNavigation();

  useFocusEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ tabBarStyle: { display: "none" } });
    return () => {
      // Reset the tab bar visibility when leaving the screen
      parent?.setOptions({
        tabBarStyle,
      });
    };
  });
}

export function CustomBottomTabBar(props: BottomTabBarProps) {
  const theme = useTheme();
  const { scrollY } = useScrollContext();
  const tabBar = useCustomTabBarHeight();

  const pathname = usePathname();
  const tabBarHideable = pathname === "/";

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
      <ScrollView
        maxWidth={230 * scale}
        $gtLg={{
          maxWidth: 270 * scale,
        }}
        brw={1}
        bc="$color4"
      >
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
        {
          backgroundColor: theme.background.val,
        },
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
      <Animated.View style={content}>
        <BottomTabBar {...props} />
      </Animated.View>
    </Animated.View>
  );
}
