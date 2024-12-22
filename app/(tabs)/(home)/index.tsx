import { View } from "tamagui";
import { Feed } from "~/src/features/home-feed";

export default function HomePage() {
  return (
    <View height="100%" bg="$background">
      <Feed />
    </View>
  );
}
