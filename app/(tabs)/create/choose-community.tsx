import { View } from "tamagui";
import { useCustomHeaderHeight } from "~/src/components/nav/hooks";
import { CreatePostStepTwo } from "~/src/features/create-post";

export default function HomePage() {
  const header = useCustomHeaderHeight();
  return (
    <View bg="$background" flex={1} pt={header.height}>
      <CreatePostStepTwo />
    </View>
  );
}
