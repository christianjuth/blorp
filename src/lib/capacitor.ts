import { Capacitor } from "@capacitor/core";

const platform = Capacitor.getPlatform();

export function isCapacitor() {
  return platform === "ios" || platform === "android";
}
