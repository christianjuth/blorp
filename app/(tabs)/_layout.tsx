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
import { useNotificationCount } from "~/src/lib/lemmy/index";
import { Platform } from "react-native";
import _ from "lodash";

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

  const { data: notificationCount } = useNotificationCount();
  let notificationCountLabel: string | undefined = _.isNumber(notificationCount)
    ? String(notificationCount)
    : undefined;
  if (_.isNumber(notificationCount)) {
    if (notificationCount === 0) {
      notificationCountLabel = undefined;
    } else if (notificationCount > 9) {
      notificationCountLabel = "9+";
    }
  }

  return (
    <WebMaxHeight>
      <Tabs
        tabBar={(props) => <CustomBottomTabBar {...props} />}
        screenOptions={{
          tabBarStyle,
          header: (props) => <BottomTabBarHeader {...props} />,
          tabBarActiveTintColor: theme.accentColor?.val,
          tabBarPosition: media.gtMd ? "left" : "bottom",
          tabBarLabelPosition: media.gtMd ? "beside-icon" : "below-icon",
          freezeOnBlur: true,
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
            tabBarBadge: notificationCountLabel,
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
