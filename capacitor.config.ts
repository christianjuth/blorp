/// <reference types="@capacitor/splash-screen" />
/// <reference types="@capacitor-community/safe-area" />
/// <reference types="@capacitor-community/sqlite" />

import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "xyz.blorpblorp.app",
  appName: "Blorp",
  webDir: "dist",
  appendUserAgent: "Blorp",
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
    },
    SafeArea: {
      enabled: true,
      customColorsForSystemBars: false,
      statusBarColor: "#00000000",
      statusBarContent: "light",
      navigationBarColor: "#00000000",
      navigationBarContent: "light",
      offset: 0,
    },
    CapacitorSQLite: {
      iosDatabaseLocation: "Library/CapacitorDatabase",
      iosIsEncryption: false,
      iosKeychainPrefix: "blorp",
      androidIsEncryption: false,
    },
  },
};

export default config;
