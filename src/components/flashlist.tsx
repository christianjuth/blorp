import { FlatList as NFlatList } from "react-native";
import { FlashListProps } from "@shopify/flash-list";

// Export FlatList with FlashList types
export const FlashList = NFlatList as unknown as <T>(
  props: FlashListProps<T>,
) => React.ReactElement | null;

export { FlashListProps };
