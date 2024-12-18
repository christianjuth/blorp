import { Stack } from "one";
import { useTheme } from "tamagui";
import { Platform } from "react-native";

import { CommunityHeader } from "~/src/components/headers";
import { BlurBackground } from "~/src/components/nav/blur-background";

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
        name="communities/index"
        options={{
          title: "Communities",
          headerTransparent: Platform.OS !== "web" ? true : false,
          headerBackground: BlurBackground,
        }}
      />

      <Stack.Screen
        name="c/[communityName]/index"
        options={{
          title: "loading...",
          header: CommunityHeader,
          headerTransparent: Platform.OS !== "web" ? true : false,
        }}
      />
    </Stack>
  );
}
