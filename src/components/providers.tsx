import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isWeb, TamaguiProvider, YStack } from "tamagui";
import { Appearance, Platform } from "react-native";
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
import { useNotificationCount } from "../lib/lemmy";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { isTauri, updateTauri } from "../lib/tauri";

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

updateTauri();

function RefreshNotificationCount() {
  const { data: count } = useNotificationCount();
  if (isTauri()) {
    getCurrentWindow().setBadgeCount(count === 0 ? undefined : count);
  }
  return null;
}

function CurrentToast() {
  const header = useCustomHeaderHeight();
  const currentToast = useToastState();
  return (
    <>
      {currentToast && !currentToast.isHandledNatively && (
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
          bg={currentToast.preset === "error" ? "$redDark" : undefined}
        >
          <YStack>
            <Toast.Title
              col={currentToast.preset === "error" ? "white" : undefined}
            >
              {currentToast.title}
            </Toast.Title>
            {!!currentToast.message && (
              <Toast.Description>{currentToast.message}</Toast.Description>
            )}
          </YStack>
        </Toast>
      )}
      <ToastViewport
        flexDirection="column"
        // top={header.height + 5}
        top={header.insetTop + 7}
        left={0}
        right={0}
        portalToRoot={isWeb}
      />
    </>
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
    }, 500);

    const { remove } = Appearance.addChangeListener(listener);

    return () => remove();
  }, []);

  return (
    <TamaguiProvider disableInjectCSS config={config} defaultTheme={scheme}>
      {children}
    </TamaguiProvider>
  );
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider>
      <TamaguiRootProvider>
        <ToastProvider>
          <ScrollProvider>
            <QueryClientProvider client={queryClient}>
              <RefreshNotificationCount />
              <AlertProvider>
                <AuthProvider>{children}</AuthProvider>
              </AlertProvider>
            </QueryClientProvider>
          </ScrollProvider>

          <CurrentToast />
        </ToastProvider>
      </TamaguiRootProvider>
    </SafeAreaProvider>
  );
}
