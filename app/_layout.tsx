import "./_layout.css";
import "./tamagui.css";

import { LoadProgressBar, Slot } from "one";
import { isWeb } from "tamagui";
import { Providers } from "~/src/components/providers";
import { Tabs } from "one";
import { useWindowDimensions } from "react-native";
import { Home } from "@tamagui/lucide-icons";

export default function Layout() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 900;

  return (
    <>
      {isWeb && (
        <>
          <meta charSet="utf-8" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, maximum-scale=5"
          />
          <link rel="icon" href="/favicon.svg" />
        </>
      )}

      <LoadProgressBar />

      <Providers>
        {isLargeScreen ? (
          <Slot />
        ) : (
          <Tabs
            screenOptions={
              {
                // tabBarStyle: {
                //   position: "absolute",
                //   backgroundColor: "transparent",
                // },
                // tabBarBackground: () => (
                //   <View pos="absolute" t="$0" r="$0" b="$0" l="$0" bg="$color1" />
                // ),
              }
            }
          >
            <Tabs.Screen
              name="index"
              options={{
                title: "Home",
                tabBarIcon: ({ color }) => <Home color={color} />,
              }}
            />
          </Tabs>
        )}
      </Providers>
    </>
  );
}
