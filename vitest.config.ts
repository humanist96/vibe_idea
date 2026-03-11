import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["src/lib/**/*.ts"],
      exclude: ["src/lib/**/*.d.ts", "src/lib/db/**"],
      thresholds: { lines: 80, functions: 80, branches: 75 },
    },
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
