import { View } from "tamagui";

export function BlurBackground() {
  return (
    <View bg="$background" opacity={1} pos="absolute" t={0} r={0} b={0} l={0} />
  );
}
