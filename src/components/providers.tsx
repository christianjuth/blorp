import { QueryClient } from "@tanstack/react-query";
import {
  PersistedClient,
  Persister,
  PersistQueryClientProvider,
} from "@tanstack/react-query-persist-client";
import _ from "lodash";
import { useNotificationCount } from "../lib/api";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { updateTauri } from "../lib/tauri";
import { isTauri } from "../lib/device";
import { AuthProvider } from "./auth-context";
import { createDb } from "../lib/create-storage";
import pRetry from "p-retry";
import { broadcastQueryClient } from "@tanstack/query-broadcast-client-experimental";
import { Toaster } from "@/src/components/ui/sonner";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// List the last reason for bumping the key:
// Caching creator profiles when fetching comments
const REACT_QUERY_CACHE_VERSON = 7;

function pruneInfinitePages(client: PersistedClient): PersistedClient {
  const cacheState = client.clientState;
  return {
    ...client,
    clientState: {
      ...cacheState,
      queries: cacheState.queries.map((q: any) => {
        const data = q.state.data;
        if (
          data &&
          typeof data === "object" &&
          Array.isArray(data.pages) &&
          Array.isArray(data.pageParams)
        ) {
          return {
            ...q,
            state: {
              ...q.state,
              data: {
                pages: data.pages.slice(0, 3),
                pageParams: data.pageParams.slice(0, 3),
              },
            },
          };
        }
        return q;
      }),
    },
  };
}

const db = createDb("react-query");
const persister: Persister = {
  persistClient: async (client) => {
    await db.setItem(
      "react-query-cache",
      JSON.stringify(pruneInfinitePages(client)),
    );
  },
  restoreClient: async () => {
    try {
      const cache = await pRetry(() => db.getItem("react-query-cache"), {
        retries: 5,
      });
      return cache ? JSON.parse(cache) : undefined;
    } catch {
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
  const counts = useNotificationCount() ?? [];
  const count = _.sum(counts);
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
      <ReactQueryDevtools />
    </PersistQueryClientProvider>
  );
}
