import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";
import { useMedia } from "tamagui";
import { scale } from "~/config/tamagui/scale";
import { isCatalyst } from "~/src/lib/is-catalyst";

export const useCustomHeaderHeight = () => {
  const insets = useSafeAreaInsets();
  const media = useMedia();

  // Default header heights based on platform
  const defaultHeaderHeight = Platform.select({
    ios: media.md ? 35 : isCatalyst ? 42 : 48, // Default header height on iOS
    android: 56, // Default header height on Android
    default: 60, // Default header height for web or other platforms
  });

  const insetOffset = Platform.select({
    ios: 10, // Default header height on iOS
    android: 0, // Default header height on Android
    default: 0, // Default header height for web or other platforms
  });

  // Add safe area top inset to ensure the header accounts for the status bar
  const height = defaultHeaderHeight + insets.top;

  const insetTop = Math.max(insets.top - insetOffset, 0);

  return {
    height: height * scale,
    insetTop,
  };
};
