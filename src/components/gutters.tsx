import * as React from "react";
import { View, XStack, XStackProps } from "tamagui";

export function ContentGutters({ children, ...props }: XStackProps) {
  const [first, second] = React.Children.toArray(children);
  return (
    <XStack
      maxWidth={1000}
      w="100%"
      mx="auto"
      gap="$5"
      $gtMd={{ px: "$4" }}
      {...props}
    >
      {second ? (
        <>
          {first}
          <View w={300} $md={{ dsp: "none" }}>
            {second}
          </View>
        </>
      ) : (
        first
      )}
    </XStack>
  );
}

export function HeaderGutters({ children, ...props }: XStackProps) {
  const [first, second, third] = React.Children.toArray(children);

  return (
    <XStack
      maxWidth={1000}
      w="100%"
      mx="auto"
      gap="$3"
      px="$2"
      $gtMd={{ px: "$4" }}
      ai="center"
      {...props}
    >
      <XStack $gtMd={{ minWidth: "33%" }} ai="center">
        {first}
      </XStack>

      <XStack flex={1} ai="center" $gtMd={{ jc: "center" }}>
        {second}
      </XStack>

      <XStack jc="flex-end" $gtMd={{ minWidth: "33%" }} ai="center" gap="$3">
        {third}
      </XStack>
    </XStack>
  );
}
