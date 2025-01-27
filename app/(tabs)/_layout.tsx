import { Tabs } from "one";
import {
  Home,
  Users,
  Plus,
  Settings,
  Bell,
  Pencil,
} from "@tamagui/lucide-icons";
import { useMedia, useTheme, View } from "tamagui";
import { BottomTabBarHeader } from "~/src/components/nav/headers";
import {
  CustomBottomTabBar,
  useTabBarStyle,
} from "~/src/components/nav/bottom-tab-bar";
import { useNotificationCount } from "~/src/lib/lemmy";
import { Platform } from "react-native";

function WebMaxHeight({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== "web") {
    return children;
  }

  return <View h="100svh">{children}</View>;
}

export default function Layout() {
  const theme = useTheme();
  const media = useMedia();
  const tabBarStyle = useTabBarStyle();

  const notificationCount = useNotificationCount();

  return (
    <WebMaxHeight>
      <Tabs
        // @ts-expect-error
        tabBar={(props) => <CustomBottomTabBar {...props} />}
        screenOptions={{
          tabBarStyle,
          // @ts-expect-error
          header: (props) => <BottomTabBarHeader {...props} />,
          tabBarActiveTintColor: theme.accentColor?.val,
          tabBarPosition: media.gtMd ? "left" : "bottom",
          tabBarLabelPosition: media.gtMd ? "beside-icon" : "below-icon",
        }}
      >
        <Tabs.Screen
          name="(home)"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => <Home color={color} size="$1.5" />,
            headerShown: false,
          }}
        />

        <Tabs.Screen
          name="communities"
          options={{
            title: "Communities",
            tabBarIcon: ({ color }) => <Users color={color} size="$1.5" />,
            headerShown: false,
          }}
        />

        <Tabs.Screen
          name="create"
          options={{
            title: "Post",
            tabBarIcon: ({ color }) => <Pencil color={color} size="$1.5" />,
            headerShown: false,
          }}
        />

        <Tabs.Screen
          name="inbox"
          options={{
            title: "Inbox",
            tabBarIcon: ({ color }) => <Bell color={color} size="$1.5" />,
            headerShown: false,
            tabBarBadge: notificationCount > 0 ? notificationCount : undefined,
          }}
        />

        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color }) => <Settings color={color} size="$1.5" />,
            headerShown: false,
          }}
        />
      </Tabs>
    </WebMaxHeight>
  );
}
