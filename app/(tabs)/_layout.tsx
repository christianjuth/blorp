import { Tabs } from "one";
import {
  Home,
  Users,
  Plus,
  MessageCircleMore,
  Settings,
} from "@tamagui/lucide-icons";
import { useTheme } from "tamagui";
import { BottomTabBarHeader } from "~/src/components/nav/headers";
import { CustomBottomTabBar } from "~/src/components/nav/bottom-tab-bar";

export default function Layout() {
  const theme = useTheme();

  return (
    <Tabs
      tabBar={(props) => <CustomBottomTabBar {...props} />}
      screenOptions={{
        tabBarStyle: {
          borderTopColor: theme.color4?.val,
          backgroundColor: "transparent",
        },
        header: (props) => <BottomTabBarHeader {...props} />,
        tabBarActiveTintColor: theme.accentColor?.val,
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Home color={color} />,
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="communities"
        options={{
          title: "Communities",
          tabBarIcon: ({ color }) => <Users color={color} />,
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarIcon: ({ color }) => <Plus color={color} />,
          headerTransparent: true,
        }}
      />

      <Tabs.Screen
        name="inbox"
        options={{
          title: "Inbox",
          tabBarIcon: ({ color }) => <MessageCircleMore color={color} />,
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <Settings color={color} />,
          headerTransparent: true,
        }}
      />
    </Tabs>
  );
}
