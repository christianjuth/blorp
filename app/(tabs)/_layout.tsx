import { Tabs } from "one";
import {
  Home,
  Users,
  Plus,
  MessageCircleMore,
  Settings,
} from "@tamagui/lucide-icons";
import { useTheme } from "tamagui";
import { CustomBottomTabBar } from "~/src/components/nav/bottom-tab-bar";

export default function Layout() {
  const theme = useTheme();

  return (
    <Tabs
      tabBar={(props) => <CustomBottomTabBar {...props} />}
      screenOptions={{
        tabBarStyle: {
          borderTopColor: theme.color4.val,
          backgroundColor: "transparent",
        },
        tabBarBackground: () => <></>,
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
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color }) => <MessageCircleMore color={color} />,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <Settings color={color} />,
        }}
      />
    </Tabs>
  );
}
