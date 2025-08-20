import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import vitePluginChecker from "vite-plugin-checker";
import circleDependency from "vite-plugin-circular-dependency";
import path from "path";
import legacy from "@vitejs/plugin-legacy";

const VITE_FAST = process.env["VITE_FAST"];

const fast = VITE_FAST === "1" || VITE_FAST === "true";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  envPrefix: "REACT_APP_",
  plugins: [
    circleDependency(),
    vitePluginChecker({
      typescript: true,
    }),
    tailwindcss(),
    react(),
    ...(!fast
      ? [
          legacy({
            targets: ["defaults", "not IE 11"],
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
  publicDir: "public",
}));
