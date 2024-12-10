import { Tabs } from "one";
import { Home, Users } from "@tamagui/lucide-icons";
import { CommunityHeader } from "~/src/components/headers";
import { useTheme, useMedia } from "tamagui";

function Hide() {
  return null;
}

export default function Layout() {
  const theme = useTheme();
  const isLgScreen = useMedia().gtSm;

  return (
    <Tabs
      tabBar={isLgScreen ? Hide : undefined}
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme.color1.val,
          borderTopColor: theme.color4.val,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Home color={color} />,
          header: CommunityHeader,
        }}
      />

      <Tabs.Screen
        name="c"
        options={{
          title: "Communities",
          tabBarIcon: ({ color }) => <Users color={color} />,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
