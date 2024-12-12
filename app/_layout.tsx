import "./_layout.css";
import "./tamagui.css";

import { LoadProgressBar } from "one";
import { isWeb, View } from "tamagui";
import { MainAppTemplate } from "~/src/components/main-app-template";
import { Providers } from "~/src/components/providers";

import { Stack } from "one";
import { useTheme } from "tamagui";
import { PostHeader } from "~/src/components/headers";

function Nav() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerTintColor: theme.gray12.val,
        contentStyle: {
          backgroundColor: theme.color1.val,
        },
      }}
    >
      <Stack.Screen
        name="(tabs)"
        options={{
          headerTitle: "Home",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="c/[communityName]/posts/[postId]"
        options={{
          header: PostHeader,
          presentation: "containedTransparentModal",
          animation: "fade",
          gestureDirection: "horizontal",
        }}
      />
      <Stack.Screen name="auth" />
    </Stack>
  );
}

export default function Layout() {
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
        <MainAppTemplate>
          <Nav />
        </MainAppTemplate>
      </Providers>
    </>
  );
}
