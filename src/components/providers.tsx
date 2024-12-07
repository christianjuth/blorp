import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TamaguiProvider } from "tamagui";
import { useColorScheme } from "react-native";
import config from "~/config/tamagui/tamagui.config";

const queryClient = new QueryClient();

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
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </TamaguiRootProvider>
  );
}
