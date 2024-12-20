import AsyncStorage from "@react-native-async-storage/async-storage";

export function createDb(rowName: string) {
  return {
    async getItem(key: string): Promise<string | null> {
      const value = await AsyncStorage.getItem(`${rowName}_${key}`);
      return value;
    },
    async setItem(key: string, value: string): Promise<void> {
      await AsyncStorage.setItem(`${rowName}_${key}`, value);
    },
    async removeItem(key: string): Promise<void> {
      await AsyncStorage.removeItem(`${rowName}_${key}`);
    },
  };
}
