import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isWeb, TamaguiProvider, Theme } from "tamagui";
import { useColorScheme, Appearance } from "react-native";
import config from "~/config/tamagui/tamagui.config";
import { persist } from "./query-storage";
import { ScrollProvider } from "./nav/scroll-animation-context";
import { AuthProvider } from "./auth-context";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AlertProvider } from "./ui/alert";
import _ from "lodash";
import { useEffect, useState } from "react";

const ONE_WEEK = 1000 * 60 * 24 * 7;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: ONE_WEEK,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
      networkMode: "online",
    },
  },
});

persist(queryClient);

const TamaguiRootProvider = ({ children }: { children: React.ReactNode }) => {
  const [scheme, setScheme] = useState(Appearance.getColorScheme() ?? "light");

  useEffect(() => {
    if (!isWeb) {
      Appearance.setColorScheme(undefined);
    }

    const listener: Appearance.AppearanceListener = _.debounce((theme) => {
      setScheme(theme.colorScheme ?? "light");
    }, 50);

    const { remove } = Appearance.addChangeListener(listener);

    return () => remove();
  }, []);

  console.log(scheme);

  return (
    <TamaguiProvider disableInjectCSS config={config} defaultTheme={scheme}>
      <Theme name={scheme}>{children}</Theme>
    </TamaguiProvider>
  );
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider>
      <TamaguiRootProvider>
        <ScrollProvider>
          <QueryClientProvider client={queryClient}>
            <AlertProvider>
              <AuthProvider>{children}</AuthProvider>
            </AlertProvider>
          </QueryClientProvider>
        </ScrollProvider>
      </TamaguiRootProvider>
    </SafeAreaProvider>
  );
}
