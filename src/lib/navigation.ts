import { useWindowDimensions } from "react-native";

export function useShouldUseReactNavigation() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 900;

  return !isLargeScreen;
}
