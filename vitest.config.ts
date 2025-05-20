import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true, // Optional: to use Vitest's globals like `describe`, `it` without importing
    setupFiles: "./vitest.setup.ts", // Optional: for setting up global mocks or test helpers
    coverage: {
      // Optional: basic coverage configuration
      reporter: ["text", "json", "html"],
    },
  },
});
