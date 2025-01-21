import * as React from "react";
import { View, XStack, XStackProps } from "tamagui";

export function ContentGutters({ children, ...props }: XStackProps) {
  const [first, second] = React.Children.toArray(children);
  return (
    <XStack
      maxWidth={1000}
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
          <View w={230} $gtLg={{ w: 270 }} $md={{ dsp: "none" }}>
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

      <XStack
        jc="flex-end"
        ai="center"
        gap="$3"
        $gtMd={{ minWidth: "33%", gap: "$4" }}
      >
        {third}
      </XStack>
    </XStack>
  );
}
