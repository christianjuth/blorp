import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TamaguiProvider } from "tamagui";
import { useColorScheme } from "react-native";
import config from "~/config/tamagui/tamagui.config";
import { persist } from "./query-storage";
import { ScrollProvider } from "./nav/scroll-animation-context";
import { AuthProvider } from "./auth-context";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AlertProvider } from "./ui/alert";
import _ from "lodash";

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
  const scheme = useColorScheme();
  return (
    <TamaguiProvider
      disableInjectCSS
      config={config}
      defaultTheme={scheme ?? "light"}
    >
      {children}
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
