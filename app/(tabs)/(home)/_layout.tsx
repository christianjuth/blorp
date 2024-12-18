import { Stack } from "one";
import { useTheme } from "tamagui";
import { Platform } from "react-native";

import { CommunityHeader, HomeHeader } from "~/src/components/headers";

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
          title: "Home",
          header: HomeHeader,
          headerTransparent: Platform.OS !== "web" ? true : false,
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
