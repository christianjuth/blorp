// vitest.config.ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
  plugins: [tsconfigPaths() as any],
  resolve: {
    alias: {
      idb: path.resolve(__dirname, "./test-utils/mocks/idb.js"),
    },
  },
  test: {
    environment: "jsdom",
    watch: false,
    coverage: {
      reporter: ["text", "json-summary", "json", "html"],
      include: ["src/**"],
    },
    exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**"],
  },
});
