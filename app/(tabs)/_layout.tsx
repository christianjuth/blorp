import { Tabs, Slot } from "one";
import { Home } from "@tamagui/lucide-icons";
import { useShouldUseReactNavigation } from "~/src/lib/navigation";

export default function Layout() {
  const shouldUseTabView = useShouldUseReactNavigation();

  return (
    <>
      {!shouldUseTabView ? (
        <Slot />
      ) : (
        <Tabs>
          <Tabs.Screen
            name="index"
            options={{
              title: "Home",
              tabBarIcon: ({ color }) => <Home color={color} />,
              headerShown: false,
            }}
          />
        </Tabs>
      )}
    </>
  );
}
