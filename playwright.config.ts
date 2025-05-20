import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e", // Or wherever you plan to keep your e2e tests
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    browserName: "chromium",
    trace: "on-first-retry",
    // BaseURL to use in actions like `await page.goto('/')`
    baseURL: "http://localhost:3000", // Adjusted to your dev server URL
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // You can add other browsers here if needed later
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  webServer: {
    command: "npm run dev", // Adjusted to your dev server command
    url: "http://localhost:3000", // Adjusted to your dev server URL
    reuseExistingServer: !process.env.CI,
    stdout: "pipe",
    stderr: "pipe",
    timeout: 120 * 1000, // Optional: Increase timeout if dev server takes longer to start
  },
});
