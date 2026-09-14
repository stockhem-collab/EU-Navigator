import { defineConfig, devices } from "@playwright/test";

// Split into two projects: "unit" tests import the matching/scoring logic
// directly (no browser, fast, precise numeric assertions) and "e2e" tests
// drive the actual app in Chromium. Both share one config so `npm test` runs
// the whole suite, but only the e2e project pays for a browser + dev server.
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  projects: [
    {
      name: "unit",
      testDir: "./tests/unit",
    },
    {
      name: "e2e",
      testDir: "./tests/e2e",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:3100",
        // Optional escape hatch for environments with a pre-installed
        // Chromium at a fixed, non-standard path (e.g. a sandboxed CI
        // runner) instead of the one `playwright install` would fetch —
        // has no effect anywhere this isn't set.
        ...(process.env.PLAYWRIGHT_CHROMIUM_PATH
          ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } }
          : {}),
      },
    },
  ],
  webServer: {
    command: "npm run dev -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
