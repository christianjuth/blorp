import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export const createQueryClientWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        experimental_prefetchInRender: true,
      },
    }, // turn off retries in tests
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
