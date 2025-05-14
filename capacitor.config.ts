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
      iosIsEncryption: false,
      iosKeychainPrefix: "blorp",
      androidIsEncryption: false,
    },
    Keyboard: {
      resize: KeyboardResize.Ionic,
      style: KeyboardStyle.Dark,
      resizeOnFullScreen: true,
    },
  },
};

export default config;
