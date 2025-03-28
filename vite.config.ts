import type { UserConfig } from "vite";
import { one } from "one/vite";
import { tamaguiPlugin } from "@tamagui/vite-plugin";
import circleDependency from "vite-plugin-circular-dependency";
import vitePluginChecker from "vite-plugin-checker";
import removeConsole from "vite-plugin-remove-console";

export default {
  plugins: [
    removeConsole(),

    circleDependency(),
    one({
      web: {
        defaultRenderMode: "spa",
      },

      native: {
        // set to the key of your native app
        // will call AppRegistry.registerComponent(app.key)
        key: "blorp",
      },

      deps: {
        "react-native-markdown-display": {
          "**/*.js": ["jsx"],
        },
      },
    }),

    vitePluginChecker({
      typescript: true,
    }),

    tamaguiPlugin({
      optimize: true,
      components: ["tamagui"],
      config: "./config/tamagui/tamagui.config.ts",
      outputCSS: "./app/tamagui.css",
    }),
  ],
  resolve: {
    // Idk if this actually does anything,
    // but it can't hurt right?
    dedupe: [
      "@react-navigation/bottom-tabs",
      "@react-navigation/native",
      "@react-navigation/native-stack",
    ],
  },
} satisfies UserConfig;
