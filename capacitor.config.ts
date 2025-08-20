/// <reference types="@capacitor-community/sqlite" />

import type { CapacitorConfig } from "@capacitor/cli";
import { KeyboardResize, KeyboardStyle } from "@capacitor/keyboard";

const config: CapacitorConfig = {
  appId: "xyz.blorpblorp.app",
  appName: "Blorp",
  webDir: "dist",
  appendUserAgent: "Blorp",
  plugins: {
    CapacitorSQLite: {
      iosDatabaseLocation: "Library/CapacitorDatabase",
      iosIsEncryption: true,
      iosKeychainPrefix: "blorp",
      androidIsEncryption: true,
    },
    Keyboard: {
      resize: KeyboardResize.Ionic,
      style: KeyboardStyle.Dark,
      resizeOnFullScreen: true,
    },
    CapacitorHttp: {
      enabled: false,
    },
  },
  ios: {
    preferredContentMode: "mobile",
  },
};

export default config;
