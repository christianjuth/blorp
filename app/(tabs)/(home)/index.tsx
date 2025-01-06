import { View } from "tamagui";
import { HomeFeed } from "~/src/features/home-feed";

export default function HomePage() {
  return (
    <View height="100%" bg="$background">
      <HomeFeed />
    </View>
  );
}
