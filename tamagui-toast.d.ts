export {}; // This makes the file an ES module

declare module "@tamagui/toast" {
  interface CustomData {
    preset?: "error" | "success";
  }
}
