import { Tabs } from "one";
import { Home, Users, Plus, Settings, Bell } from "@tamagui/lucide-icons";
import { useMedia, useTheme, View } from "tamagui";
import { BottomTabBarHeader } from "~/src/components/nav/headers";
import { CustomBottomTabBar } from "~/src/components/nav/bottom-tab-bar";
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

  const notificationCount = useNotificationCount();

  return (
    <WebMaxHeight>
      <Tabs
        // @ts-expect-error
        tabBar={(props) => <CustomBottomTabBar {...props} />}
        screenOptions={{
          tabBarStyle: {
            borderTopColor: theme.color4?.val,
            backgroundColor: "transparent",
          },
          // @ts-expect-error
          header: (props) => <BottomTabBarHeader {...props} />,
          tabBarActiveTintColor: theme.accentColor?.val,
          tabBarPosition: media.gtMd ? "left" : "bottom",
          tabBarLabelPosition: "below-icon",
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
            headerShown: false,
          }}
        />

        <Tabs.Screen
          name="inbox"
          options={{
            title: "Inbox",
            tabBarIcon: ({ color }) => <Bell color={color} />,
            headerShown: false,
            tabBarBadge: notificationCount > 0 ? notificationCount : undefined,
            tabBarVisible: false,
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
    </WebMaxHeight>
  );
}
