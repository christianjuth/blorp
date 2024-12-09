import { Tabs } from "one";
import { Home, Users } from "@tamagui/lucide-icons";
import { useShouldUseReactNavigation } from "~/src/lib/navigation";
import { CommunityHeader } from "~/src/components/headers";

function Hide() {
  return null;
}

export default function Layout() {
  const shouldUseTabView = useShouldUseReactNavigation();

  return (
    <Tabs tabBar={shouldUseTabView ? undefined : Hide}>
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
