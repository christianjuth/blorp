import * as React from "react";
import { View, XStack, XStackProps } from "tamagui";

export function FeedGutters({ children, ...props }: XStackProps) {
  const [first, second] = React.Children.toArray(children);
  return (
    <XStack maxWidth={1000} w="100%" mx="auto" {...props} gap="$4">
      {second ? (
        <>
          {first}
          <View w={300}>{second}</View>
        </>
      ) : (
        first
      )}
    </XStack>
  );
}

export function FeedGuttersSplit({ children }: { children: React.ReactNode }) {
  return (
    <View maxWidth={1000} w="100%" mx="auto">
      {children}
    </View>
  );
}
