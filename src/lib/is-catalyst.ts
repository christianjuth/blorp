import { Platform } from "react-native";
import DeviceInfo from "react-native-device-info";

export const isCatalyst =
  DeviceInfo.getDeviceType() === "Desktop" && Platform.OS === "ios";
