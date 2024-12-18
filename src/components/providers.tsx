import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TamaguiProvider } from "tamagui";
import { useColorScheme } from "react-native";
import config from "~/config/tamagui/tamagui.config";
import { persist } from "./query-storage";
import { createContext, useContext, useRef } from "react";
import { useCustomHeaderHeight } from "./headers";
import {
  useSharedValue,
  useAnimatedScrollHandler,
  SharedValue,
} from "react-native-reanimated";

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

interface ScrollContextType {
  scrollY: SharedValue<number>;
  scrollHandler: (event: any) => void; // The scroll handler for your components
}

const ScrollContext = createContext<ScrollContextType | undefined>(undefined);

interface ScrollProviderProps {
  children: React.ReactNode;
}

export const ScrollProvider: React.FC<ScrollProviderProps> = ({ children }) => {
  const headerHeight = useCustomHeaderHeight().height;

  const scrollY = useSharedValue(0);
  const prevScrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      let y = event.contentOffset.y + headerHeight;
      if (y < 0) {
        y = 0;
      }
      const diff = y - prevScrollY.value;
      prevScrollY.value = y;
      scrollY.value += diff * 0.03;
      if (scrollY.value > 1) {
        scrollY.value = 1;
      } else if (scrollY.value < 0) {
        scrollY.value = 0;
      }
    },
  });

  return (
    <ScrollContext.Provider value={{ scrollY, scrollHandler }}>
      {children}
    </ScrollContext.Provider>
  );
};

export const useScrollContext = (): ScrollContextType => {
  const context = useContext(ScrollContext);
  if (!context) {
    throw new Error("useScrollContext must be used within a ScrollProvider");
  }
  return context;
};

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
    <TamaguiRootProvider>
      <ScrollProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </ScrollProvider>
    </TamaguiRootProvider>
  );
}
