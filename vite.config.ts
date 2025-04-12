import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import vitePluginChecker from "vite-plugin-checker";
import circleDependency from "vite-plugin-circular-dependency";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    circleDependency(),
    vitePluginChecker({
      typescript: true,
    }),
    tailwindcss(),
    react(),
  ],
  esbuild: {
    drop: mode === "production" ? ["console"] : [],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
  publicDir: "public",
}));
