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

export async function getDbSizes() {
  const sizes: [string, number][] = [];
  let totalSize = 0;

  const keys = await AsyncStorage.getAllKeys();

  for (const key of keys) {
    const value = await AsyncStorage.getItem(key);
    const size = new Blob([JSON.stringify(value)]).size; // Estimate size in bytes
    totalSize += size;
    sizes.push([key.toString(), size]);
  }

  return sizes
    .filter(([_, size]) => {
      return size / totalSize > 0.01;
    })
    .sort(([aKey, aSize], [bKey, bSize]) => {
      return bSize - aSize;
    });
}
