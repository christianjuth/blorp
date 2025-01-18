import { Tabs } from "one";
import {
  Home,
  Users,
  Plus,
  MessageCircleMore,
  Settings,
  Bell,
} from "@tamagui/lucide-icons";
import { useTheme } from "tamagui";
import { BottomTabBarHeader } from "~/src/components/nav/headers";
import { CustomBottomTabBar } from "~/src/components/nav/bottom-tab-bar";
import { MainAppTemplate } from "~/src/components/main-app-template";
import { useAuth } from "~/src/stores/auth";
import { useNotificationCount } from "~/src/lib/lemmy";

export default function Layout() {
  const theme = useTheme();
  const isLoggedIn = useAuth((s) => s.isLoggedIn());

  const notificationCount = useNotificationCount();

  return (
    <MainAppTemplate>
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

        {isLoggedIn ? (
          <Tabs.Screen
            name="inbox"
            options={{
              title: "Inbox",
              tabBarIcon: ({ color }) => <Bell color={color} />,
              headerShown: false,
              tabBarBadge:
                notificationCount > 0 ? notificationCount : undefined,
            }}
          />
        ) : null}

        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color }) => <Settings color={color} />,
            headerTransparent: true,
          }}
        />
      </Tabs>
    </MainAppTemplate>
  );
}
