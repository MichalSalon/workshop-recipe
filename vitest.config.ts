import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@deck/shared": fileURLToPath(
        new URL("./packages/shared/src/index.ts", import.meta.url),
      ),
      "@deck/engine": fileURLToPath(
        new URL("./packages/engine/src/index.ts", import.meta.url),
      ),
    },
  },
});
