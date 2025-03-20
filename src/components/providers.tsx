import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { persist } from "./query-storage";
// import { AuthProvider } from "./auth-context";
// import { AlertProvider } from "./ui/alert";
import _ from "lodash";
import { useNotificationCount } from "../lib/lemmy";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { isTauri, updateTauri } from "../lib/tauri";
import { AuthProvider } from "./auth-context";

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

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <RefreshNotificationCount />
      <AuthProvider>{children}</AuthProvider>
      {/* </AlertProvider> */}
    </QueryClientProvider>
  );
}
