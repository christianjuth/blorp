import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import vitePluginChecker from "vite-plugin-checker";
import circleDependency from "vite-plugin-circular-dependency";
import path from "path";
import legacy from "@vitejs/plugin-legacy";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    circleDependency(),
    vitePluginChecker({
      typescript: true,
    }),
    tailwindcss(),
    react(),
    legacy({
      targets: ["defaults", "not IE 11"],
    }),
  ],
  //esbuild: {
  //  drop: mode === "production" ? ["console"] : [],
  //},
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
  publicDir: "public",
  //build: {
  //  rollupOptions: {
  //    input: {
  //      main: path.resolve(__dirname, "index.html"),
  //      background: path.resolve(__dirname, "src/background-runner.ts"),
  //    },
  //    output: {
  //      entryFileNames: (chunk) =>
  //        chunk.name === "background"
  //          ? "background-runner.js"
  //          : "[name]-[hash].js",
  //    },
  //  },
  //},
}));
