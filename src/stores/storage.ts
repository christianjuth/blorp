import { PersistStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function createStorage<S>(): PersistStorage<S> {
  return {
    getItem: async (key) => {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    },
    setItem: async (key, value) => {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    },
    removeItem: async (key) => {
      await AsyncStorage.removeItem(key);
    },
  };
}
