import { Stack } from "one";
import { useMedia, useTheme } from "tamagui";

import { SettingsHeader, StackHeader } from "~/src/components/nav/headers";

export default function Layout() {
  const theme = useTheme();
  const media = useMedia();
  return (
    <Stack
      screenOptions={{
        headerTintColor: theme.gray12.val,
        contentStyle: {
          backgroundColor: theme.background.val,
        },
        header: (props) => <StackHeader {...props} />,
        animation: media.gtMd ? "none" : "default",
        freezeOnBlur: true,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Inbox",
          header: (props) => <SettingsHeader {...props} />,
        }}
      />
    </Stack>
  );
}
