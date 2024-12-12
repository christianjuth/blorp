import AsyncStorage from "@react-native-async-storage/async-storage";
// import { StoragePersister } from "./storage";

// export interface StoragePersister {
//   persistClient: (client: unknown) => Promise<void>;
//   restoreClient: () => Promise<unknown | undefined>;
//   removeClient: () => Promise<void>;
// }

export const createStoragePersister = async () => ({
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
});
