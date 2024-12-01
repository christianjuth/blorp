import { useWindowDimensions } from "react-native";
import { Platform } from "react-native";

export function useShouldUseReactNavigation() {
  if (Platform.OS !== "web") {
    return true;
  }

  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 900;

  return !isLargeScreen;
}
