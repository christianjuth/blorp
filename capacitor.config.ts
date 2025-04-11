/// <reference types="@capacitor/splash-screen" />
/// <reference types="@capacitor-community/safe-area" />
/// <reference types="@capacitor-community/sqlite" />
/// <reference types="@capacitor/keyboard" />

import type { CapacitorConfig } from "@capacitor/cli";
import { KeyboardResize, KeyboardStyle } from "@capacitor/keyboard";

const config: CapacitorConfig = {
  appId: "xyz.blorpblorp.app",
  appName: "Blorp",
  webDir: "dist",
  appendUserAgent: "Blorp",
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
    },
    // SafeArea: {
    //   enabled: true,
    //   customColorsForSystemBars: true,
    //   statusBarColor: "#000000",
    //   statusBarContent: "light",
    //   navigationBarColor: "#000000",
    //   navigationBarContent: "light",
    //   offset: 0,
    // },
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
