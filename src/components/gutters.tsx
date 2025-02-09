import * as React from "react";
import { View, XStack, XStackProps } from "tamagui";
import { scale } from "~/config/tamagui/scale";

export function ContentGutters({ children, ...props }: XStackProps) {
  const [first, second] = React.Children.toArray(children);
  return (
    <XStack
      maxWidth={1050 * scale}
      w="100%"
      mx="auto"
      gap="$4"
      {...props}
      $gtMd={{ px: "$4", ...props.$gtMd }}
      $gtLg={{ px: "$5", gap: "$5", ...props.$gtLg }}
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
