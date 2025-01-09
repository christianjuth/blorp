import { CreatePost } from "~/src/features/create-post";
import { View } from "tamagui";
import { useCustomHeaderHeight } from "~/src/components/nav/hooks";

export default function HomePage() {
  const header = useCustomHeaderHeight();
  return (
    <View bg="$background" flex={1} pt={header.height}>
      <CreatePost />
    </View>
  );
}
