import { View } from "tamagui";
import { Feed } from "~/src/features/feed";

export function HomePage() {
  return (
    <View maxWidth={800} mx="auto" w="100%">
      <Feed />
    </View>
  );
}
