import type { UserConfig } from "vite";
import { one } from "one/vite";
import { tamaguiPlugin } from "@tamagui/vite-plugin";
import circleDependency from "vite-plugin-circular-dependency";

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
        key: "one-example",
      },

      deps: {
        "react-native-markdown-display": {
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
} satisfies UserConfig;
