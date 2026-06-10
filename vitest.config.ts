import { defineConfig } from "vitest/config";
import { resolve } from "path";

const alias = { "@": resolve(__dirname, "./src") };

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: "unit",
          include: ["tests/lib/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        resolve: { alias },
        test: {
          name: "integration",
          include: ["tests/db/**/*.test.ts"],
          environment: "node",
          globalSetup: ["./tests/global-setup.ts"],
          setupFiles: ["./tests/setup.ts"],
          testTimeout: 30000,
          fileParallelism: false,
        },
      },
    ],
  },
});
