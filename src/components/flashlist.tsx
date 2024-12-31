import type { FlashListProps } from "@shopify/flash-list";
import { FlatList as NFlatList, FlatListProps } from "react-native";
import { forwardRef } from "react";

type Combined<T> = FlatListProps<T> &
  Omit<FlashListProps<T>, "data" | "renderItem">;

interface Props<T> extends Combined<T> {
  ref?: React.LegacyRef<any>;
}

const forwardRefWithGenerics = <T,>(
  render: (
    props: Props<T>,
    ref: React.Ref<NFlatList<T>>,
  ) => React.ReactElement | null,
) =>
  forwardRef(render) as unknown as <T>(
    props: Props<T> & React.RefAttributes<NFlatList<T>>,
  ) => React.ReactElement | null;

export const FlashList = forwardRefWithGenerics<NFlatList<any>>(
  <T,>(props: Props<T>, ref: React.Ref<NFlatList<T>>) => {
    return <NFlatList {...props} ref={ref} />;
  },
);
