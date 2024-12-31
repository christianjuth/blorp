import { FlashList as NFlashList, FlashListProps } from "@shopify/flash-list";
import { forwardRef } from "react";
import type { FlatListProps } from "react-native";

type Combined<T> = Omit<FlatListProps<T>, "data" | "renderItem"> &
  FlashListProps<T>;

interface Props<T> extends Combined<T> {
  ref?: React.LegacyRef<any>;
}

const forwardRefWithGenerics = <T,>(
  render: (
    props: Props<T>,
    ref: React.Ref<NFlashList<T>>,
  ) => React.ReactElement | null,
) =>
  forwardRef(render) as unknown as <T>(
    props: Props<T> & React.RefAttributes<NFlashList<T>>,
  ) => React.ReactElement | null;

export const FlashList = forwardRefWithGenerics<NFlashList<any>>(
  <T,>(props: Props<T>, ref: React.Ref<any>) => {
    return <NFlashList {...props} ref={ref} />;
  },
);
