import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import vitePluginChecker from "vite-plugin-checker";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    tsconfigPaths(),
    // vitePluginChecker({
    //   typescript: true,
    // }),
    tailwindcss(),
    react(),
  ],
  esbuild: {
    drop: mode === "production" ? ["console"] : [],
  },
  publicDir: "public",
}));
