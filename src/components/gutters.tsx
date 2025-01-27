import * as React from "react";
import { View, XStack, XStackProps } from "tamagui";
import { scale } from "~/config/tamagui/scale";

export function ContentGutters({ children, ...props }: XStackProps) {
  const [first, second] = React.Children.toArray(children);
  return (
    <XStack
      maxWidth={1000 * scale}
      w="100%"
      mx="auto"
      gap="$4"
      $gtMd={{ px: "$4" }}
      $gtLg={{ px: "$5", gap: "$5" }}
      {...props}
    >
      {second ? (
        <>
          {first}
          <View
            w={230 * scale}
            $gtLg={{ w: 270 * scale }}
            $md={{ dsp: "none" }}
          >
            {second}
          </View>
        </>
      ) : (
        first
      )}
    </XStack>
  );
}
