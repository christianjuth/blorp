import type { FlashListProps as NFlashListProps } from "@shopify/flash-list";
import { FlatList as NFlatList, FlatListProps } from "react-native";
import { forwardRef } from "react";

type Combined<T> = FlatListProps<T> &
  Omit<NFlashListProps<T>, "data" | "renderItem">;

export interface FlashListProps<T> extends Combined<T> {
  ref?: React.LegacyRef<any>;
}

const forwardRefWithGenerics = <T,>(
  render: (
    props: FlashListProps<T>,
    ref: React.Ref<NFlatList<T>>,
  ) => React.ReactElement | null,
) =>
  forwardRef(render) as unknown as <T>(
    props: FlashListProps<T> & React.RefAttributes<NFlatList<T>>,
  ) => React.ReactElement | null;

export const FlashList = forwardRefWithGenerics<NFlatList<any>>(
  <T,>(props: FlashListProps<T>, ref: React.Ref<NFlatList<T>>) => {
    return <NFlatList {...props} ref={ref} />;
  },
);
