import { Stack } from "one";
import { useTheme } from "tamagui";

import { CommunityHeader } from "~/src/components/headers";

export default function Layout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerTintColor: theme.gray12.val,
        contentStyle: {
          backgroundColor: theme.color1.val,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Communities",
        }}
      />

      <Stack.Screen
        name="[communityId]/index"
        options={{
          title: "loading...",
          header: CommunityHeader,
        }}
      />
    </Stack>
  );
}
