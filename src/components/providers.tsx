import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isWeb, TamaguiProvider, Theme, XStack, YStack } from "tamagui";
import { useColorScheme, Appearance } from "react-native";
import config from "~/config/tamagui/tamagui.config";
import { persist } from "./query-storage";
import { ScrollProvider } from "./nav/scroll-animation-context";
import { AuthProvider } from "./auth-context";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AlertProvider } from "./ui/alert";
import _ from "lodash";
import { useEffect, useState } from "react";
import {
  ToastProvider,
  useToastState,
  Toast,
  ToastViewport,
} from "@tamagui/toast";
import { useCustomHeaderHeight } from "./nav/hooks";

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

function CurrentToast() {
  const currentToast = useToastState();

  if (!currentToast || currentToast.isHandledNatively) return null;

  return (
    <Toast
      key={currentToast.id}
      duration={currentToast.duration}
      enterStyle={{ opacity: 0, scale: 0.5, y: -25 }}
      exitStyle={{ opacity: 0, scale: 1, y: -20 }}
      y={0}
      opacity={1}
      scale={1}
      animation="100ms"
      viewportName={currentToast.viewportName}
    >
      <YStack>
        <Toast.Title>{currentToast.title}</Toast.Title>
        {!!currentToast.message && (
          <Toast.Description>{currentToast.message}</Toast.Description>
        )}
      </YStack>
    </Toast>
  );
}

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

  return (
    <TamaguiProvider disableInjectCSS config={config} defaultTheme={scheme}>
      <Theme name={scheme}>{children}</Theme>
    </TamaguiProvider>
  );
};

export function Providers({ children }: { children: React.ReactNode }) {
  const header = useCustomHeaderHeight();

  return (
    <SafeAreaProvider>
      <TamaguiRootProvider>
        <ToastProvider>
          <ScrollProvider>
            <QueryClientProvider client={queryClient}>
              <AlertProvider>
                <AuthProvider>{children}</AuthProvider>
              </AlertProvider>
            </QueryClientProvider>
          </ScrollProvider>

          <CurrentToast />
          <ToastViewport
            flexDirection="column"
            top={header.height + 5}
            left={0}
            right={0}
          />
        </ToastProvider>
      </TamaguiRootProvider>
    </SafeAreaProvider>
  );
}
