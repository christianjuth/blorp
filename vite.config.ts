import type { UserConfig } from "vite";
import { one } from "one/vite";
import { tamaguiPlugin } from "@tamagui/vite-plugin";
import circleDependency from "vite-plugin-circular-dependency";
import path from "path";

export default {
  plugins: [
    circleDependency(),
    one({
      web: {
        defaultRenderMode: "spa",
      },

      app: {
        // set to the key of your native app
        // will call AppRegistry.registerComponent(app.key)
        key: "blorp",
      },

      deps: {
        "react-native-markdown-display": {
          "**/*.js": ["jsx"],
        },
        "expo-linear-gradient": {
          "**/*.js": ["jsx"],
        },
        "react-native-pell-rich-editor": {
          "**/*.js": ["jsx"],
        },
      },
    }),

    tamaguiPlugin({
      optimize: true,
      components: ["tamagui"],
      config: "./config/tamagui/tamagui.config.ts",
      outputCSS: "./app/tamagui.css",
    }),
  ],
  resolve: {
    alias: {
      punycode: "punycode/",
      "expo-modules-core": path.resolve(
        __dirname,
        "node_modules/expo-modules-core/",
      ),
    },
  },
} satisfies UserConfig;
