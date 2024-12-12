import { QueryClient } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const persist = async (queryClient: QueryClient) => {
  const persister = {
    persistClient: async (client) => {
      await AsyncStorage.setItem("react-query-cache", JSON.stringify(client));
    },
    restoreClient: async () => {
      const cache = await AsyncStorage.getItem("react-query-cache");
      return cache ? JSON.parse(cache) : undefined;
    },
    removeClient: async () => {
      await AsyncStorage.removeItem("react-query-cache");
    },
  };

  // Persist the QueryClient state to AsyncStorage
  persistQueryClient({
    queryClient,
    persister,
  });
};
