import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";

export const useCustomHeaderHeight = () => {
  const insets = useSafeAreaInsets();

  // Default header heights based on platform
  const defaultHeaderHeight = Platform.select({
    ios: 40, // Default header height on iOS
    android: 56, // Default header height on Android
    default: 65, // Default header height for web or other platforms
  });

  const insetOffset = Platform.select({
    ios: 5, // Default header height on iOS
    android: 0, // Default header height on Android
    default: 0, // Default header height for web or other platforms
  });

  // Add safe area top inset to ensure the header accounts for the status bar
  const height = defaultHeaderHeight + insets.top;

  const insetTop = Math.max(insets.top - insetOffset, 0);

  return {
    height,
    insetTop,
  };
};
