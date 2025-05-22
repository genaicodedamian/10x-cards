import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true, // Optional: to use Vitest's globals like `describe`, `it` without importing
    setupFiles: "./vitest.setup.ts", // Optional: for setting up global mocks or test helpers
    coverage: {
      // Optional: basic coverage configuration
      reporter: ["text", "json", "html"],
    },
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/cypress/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*",
      "**/tests/e2e/**" // Exclude E2E tests directory
    ]
  },
});
