import "./_layout.css";
import "./tamagui.css";

import { LoadProgressBar } from "one";
import { isWeb } from "tamagui";
import { MainAppTemplate } from "~/src/components/main-app-template";
import { Providers } from "~/src/components/providers";

import { Stack } from "one";
import { useTheme, View } from "tamagui";
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
          headerBackground: () => (
            <View
              pos="absolute"
              t="$0"
              r="$0"
              b="$0"
              l="$0"
              bg="$color1"
              bbw={1}
              bbc="$color5"
            />
          ),
        }}
      />
      <Stack.Screen
        name="posts/[postId]"
        options={{
          header: PostHeader,
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
