import { Stack } from "one";
import { useTheme, View } from "tamagui";

export default function Layout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerBackground: () => (
          <View
            pos="absolute"
            t="$0"
            r="$0"
            b="$0"
            l="$0"
            bg="$color1"
            bbw={1}
            bbc="$color5"
          />
        ),
        headerTintColor: theme.gray12.val,
        contentStyle: {
          backgroundColor: "transparent",
        },
        presentation: "transparentModal",
      }}
    >
      <Stack.Screen name="index" options={{ headerTitle: "Home" }} />
      <Stack.Screen name="posts/[postId]" />
    </Stack>
  );
}
