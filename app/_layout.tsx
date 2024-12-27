import "./_layout.css";
import "./tamagui.css";

import { LoadProgressBar } from "one";
import { isWeb } from "tamagui";
import { MainAppTemplate } from "~/src/components/main-app-template";
import { Providers } from "~/src/components/providers";

import { Stack } from "one";
import { useTheme } from "tamagui";
import { ModalHeader } from "~/src/components/nav/headers";

function Nav() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerTintColor: theme.gray12.val,
        contentStyle: {
          backgroundColor: theme.background.val,
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
        name="auth"
        options={{
          presentation: "containedTransparentModal",
          animation: "slide_from_bottom",
          header: ModalHeader,
          headerTitle: "Auth",
          title: "Auth",
        }}
      />
    </Stack>
  );
}

export default function Layout() {
  return (
    <>
      {isWeb && (
        <>
          <meta name="apple-itunes-app" content="app-id=6739925430" />
          o
          <meta charSet="utf-8" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, maximum-scale=5"
          />
          <link
            rel="apple-touch-icon"
            sizes="57x57"
            href="/apple-icon-57x57.png"
          />
          <link
            rel="apple-touch-icon"
            sizes="60x60"
            href="/apple-icon-60x60.png"
          />
          <link
            rel="apple-touch-icon"
            sizes="72x72"
            href="/apple-icon-72x72.png"
          />
          <link
            rel="apple-touch-icon"
            sizes="76x76"
            href="/apple-icon-76x76.png"
          />
          <link
            rel="apple-touch-icon"
            sizes="114x114"
            href="/apple-icon-114x114.png"
          />
          <link
            rel="apple-touch-icon"
            sizes="120x120"
            href="/apple-icon-120x120.png"
          />
          <link
            rel="apple-touch-icon"
            sizes="144x144"
            href="/apple-icon-144x144.png"
          />
          <link
            rel="apple-touch-icon"
            sizes="152x152"
            href="/apple-icon-152x152.png"
          />
          <link
            rel="apple-touch-icon"
            sizes="180x180"
            href="/apple-icon-180x180.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="192x192"
            href="/android-icon-192x192.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="32x32"
            href="/favicon-32x32.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="96x96"
            href="/favicon-96x96.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="16x16"
            href="/favicon-16x16.png"
          />
          <link rel="manifest" href="/manifest.json" />
          <meta name="msapplication-TileColor" content="#ffffff" />
          <meta name="msapplication-TileImage" content="/ms-icon-144x144.png" />
          <meta name="theme-color" content="#ffffff" />
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
