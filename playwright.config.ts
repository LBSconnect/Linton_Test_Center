import { defineConfig, devices } from "@playwright/test";
import path from "path";

/**
 * Playwright configuration for LBS booking + payment E2E tests.
 *
 * Local:  BASE_URL defaults to http://localhost:5000
 * CI:     Set BASE_URL env var to point at the staging/preview URL.
 *
 * Required env vars (copy .env.test.example → .env.test):
 *   BASE_URL            – app base URL
 *   DATABASE_URL        – Postgres connection string (for DB assertions)
 *   STRIPE_SECRET_KEY   – Stripe secret key (for webhook simulation)
 *   STRIPE_WEBHOOK_SECRET – Webhook signing secret (stripe listen --print-secret)
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // concurrency tests require serial ordering within spec files
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 1,
  reporter: [
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["list"],
  ],
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:5000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Seed DB before all tests; teardown after
  globalSetup: path.resolve("./tests/fixtures/seed.ts"),
  globalTeardown: path.resolve("./tests/fixtures/teardown.ts"),
});
