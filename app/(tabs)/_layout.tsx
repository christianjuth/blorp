import { Tabs } from "one";
import {
  Home,
  Users,
  Plus,
  MessageCircleMore,
  Bell,
} from "@tamagui/lucide-icons";
import { CommunityHeader } from "~/src/components/headers";
import { useTheme, useMedia } from "tamagui";
import { BlurBackground } from "~/src/components/nav/blur-background";
import { Platform } from "react-native";

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
          borderTopColor: theme.color4.val,
          position: "absolute",
          backgroundColor: "transparent",
        },
        tabBarBackground: BlurBackground,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Home color={color} />,
          header: CommunityHeader,
          headerTransparent: Platform.OS !== "web" ? true : false,
        }}
      />

      <Tabs.Screen
        name="(stack)"
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
        name="inbox"
        options={{
          title: "Inbox",
          tabBarIcon: ({ color }) => <Bell color={color} />,
        }}
      />
    </Tabs>
  );
}
