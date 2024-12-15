import { View } from "tamagui";

export function BlurBackground() {
  return (
    <View bg="$color1" opacity={0.95} pos="absolute" t={0} r={0} b={0} l={0} />
  );
}
