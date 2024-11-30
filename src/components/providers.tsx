import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SchemeProvider, useColorScheme } from "@vxrn/color-scheme";
import { TamaguiProvider } from "tamagui";
import config from "~/config/tamagui/tamagui.config";

const queryClient = new QueryClient();

const TamaguiRootProvider = ({ children }: { children: React.ReactNode }) => {
  const [scheme] = useColorScheme();

  return (
    <TamaguiProvider
      disableInjectCSS
      config={config}
      defaultTheme={scheme}
      disableRootThemeClass
    >
      {children}
    </TamaguiProvider>
  );
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SchemeProvider>
      <TamaguiRootProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </TamaguiRootProvider>
    </SchemeProvider>
  );
}
