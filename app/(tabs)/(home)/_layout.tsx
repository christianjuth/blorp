import { Stack } from "one";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerTitle: "Home" }} />
      <Stack.Screen name="posts/[postId]" />
    </Stack>
  );
}
