import { defineConfig, devices } from "@playwright/test";

// Uses the real publishable key from .env, with no frontend secret key.
// This verifies the Clerk UI loads; it does not submit credentials or create users.
export default defineConfig({
  testDir: "./auth-tests",
  timeout: 60000,
  workers: 1,
  use: {
    baseURL: process.env.AUTH_TEST_BASE_URL || "http://localhost:3111",
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
    viewport: { width: 1440, height: 1000 },
  },
  webServer: process.env.AUTH_TEST_BASE_URL
    ? undefined
    : {
        command: "bun run dev -- --port 3111",
        url: "http://localhost:3111",
        timeout: 120000,
        env: { CLERK_SECRET_KEY: "", NEXT_TEST_DIST_DIR: ".next-auth-tests" },
      },
});
