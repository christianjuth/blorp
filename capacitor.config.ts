/// <reference types="@capacitor/splash-screen" />

import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "xyz.blorp.app",
  appName: "Blorp",
  webDir: "dist",
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
    },
  },
};

export default config;
