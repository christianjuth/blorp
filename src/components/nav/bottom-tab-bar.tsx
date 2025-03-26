import { BottomTabBarProps, BottomTabBar } from "@react-navigation/bottom-tabs";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { isWeb, ScrollView, useMedia, useTheme, View } from "tamagui";
import { useScrollContext } from "./scroll-animation-context";
import { interpolate, useAnimatedStyle } from "react-native-reanimated";
import Animated from "react-native-reanimated";
import { Sidebar } from "./sidebar";
import { SafeAreaView, useFocusEffect, useNavigation, usePathname } from "one";
import { isTauri } from "~/src/lib/tauri";
import { useCallback } from "react";

export const useCustomTabBarHeight = () => {
  const insets = useSafeAreaInsets();

  // Default header heights based on platform
  const defaultHeaderHeight = Platform.select({
    ios: 49, // Default header height on iOS
    android: 56, // Default header height on Android
    default: 65, // Default header height for web or other platforms
  });

  // Add safe area top inset to ensure the header accounts for the status bar
  const height = defaultHeaderHeight + 30;
  return {
    height,
    insetBottom: 30,
  };
};

export function useTabBarStyle() {
  return {
    backgroundColor: "transparent",
    borderTopWidth: 0,
  };
}

export function useHideTabBar() {
  const tabBarStyle = useTabBarStyle();
  const setNavOptions = useNavigation().getParent()?.setOptions;

  useFocusEffect(
    useCallback(() => {
      setNavOptions?.({ tabBarStyle: { display: "none" } });
      return () => {
        // Reset the tab bar visibility when leaving the screen
        setNavOptions?.({
          tabBarStyle,
        });
      };
    }, [setNavOptions]),
    [setNavOptions],
  );
}

export function CustomBottomTabBar(props: BottomTabBarProps) {
  const theme = useTheme();
  const { scrollY } = useScrollContext();
  const header = useCustomTabBarHeight();
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
      <View
        flex={1}
        maxWidth={230}
        $gtLg={{
          maxWidth: 270,
        }}
        brw={1}
        bc="$color3"
        bg="$background"
        tag="aside"
        pt={isTauri() ? "$5" : undefined}
        data-tauri-drag-region
      >
        <ScrollView>
          <SafeAreaView>
            <Sidebar {...props} />
          </SafeAreaView>
        </ScrollView>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        container,
        {
          backgroundColor: theme.background.val,
          borderTopWidth: 0.5,
          borderTopColor: theme.color3.val,
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
