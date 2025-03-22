import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import removeConsole from "vite-plugin-remove-console";
import vitePluginChecker from "vite-plugin-checker";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tsconfigPaths(),
    // vitePluginChecker({
    //   typescript: true,
    // }),
    tailwindcss(),
    react(),
    removeConsole(),
  ],
  publicDir: "public",
});
