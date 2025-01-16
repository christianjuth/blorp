// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    watch: false,
    coverage: {
      reporter: ["text", "json", "html"],
      include: ["src/**"],
    },
  },
});
