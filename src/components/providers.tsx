import { QueryClient } from "@tanstack/react-query";
import {
  Persister,
  PersistQueryClientProvider,
} from "@tanstack/react-query-persist-client";
import _ from "lodash";
import { useNotificationCount } from "../lib/lemmy";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { isTauri, updateTauri } from "../lib/tauri";
import { AuthProvider } from "./auth-context";
import { createDb } from "../lib/create-storage";
import pRetry from "p-retry";
import { broadcastQueryClient } from "@tanstack/query-broadcast-client-experimental";
import * as Sentry from "@sentry/react";
import { Toaster } from "@/src/components/ui/sonner";

const REACT_QUERY_CACHE_VERSON = 4;

const db = createDb("react-query");
const persister: Persister = {
  persistClient: async (client) => {
    await db.setItem("react-query-cache", JSON.stringify(client));
  },
  restoreClient: async () => {
    try {
      const cache = await pRetry(() => db.getItem("react-query-cache"), {
        retries: 5,
        onFailedAttempt: (err) => {
          Sentry.captureException(err);
        },
      });
      return cache ? JSON.parse(cache) : undefined;
    } catch (err) {
      Sentry.captureException(err);
      window.location.reload();
    }
  },
  removeClient: async () => {
    await db.removeItem("react-query-cache");
  },
};

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

// Enable multi-tab synchronization
broadcastQueryClient({
  queryClient,
  broadcastChannel: "react-query-sync",
});

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
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        buster: String(REACT_QUERY_CACHE_VERSON),
      }}
    >
      <RefreshNotificationCount />
      <AuthProvider>{children}</AuthProvider>
      <Toaster />
    </PersistQueryClientProvider>
  );
}
