import { defineConfig, devices } from "@playwright/test";
import { loadProjectConfig } from "./config/load-config";

loadProjectConfig();

const AUTH_FILE = "playwright/.auth/user.json";

export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [
        ["blob", { outputDir: "blob-report" }],
        ["junit", { outputFile: "test-results/junit.xml" }],
        ["line"],
      ]
    : [
        ["./scripts/custom-reporter.ts"],
        ["html"],
        ["line"],
        ["junit", { outputFile: "test-results/junit.xml" }],
      ],
  timeout: 30000,
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  projects: [
    // Runs once before all UI projects — logs in and saves storage state.
    // If APP_EMAIL / APP_PASSWORD are not set, saves an empty state so UI
    // tests still run (unauthenticated). See tests/auth/auth.setup.ts.
    {
      name: "setup",
      testMatch: "**/auth/auth.setup.ts",
      retries: 0,
      use: { baseURL: process.env.APP_BASE_URL ?? "https://en.wikipedia.org" },
    },

    // Unit tests — no browser. Cover utilities (FakerDataGenerator, ResponseExtractor, etc.)
    {
      name: "unit",
      testDir: "./tests/unit",
      retries: 0,
    },

    // Marvel App API tests (GraphQL — https://api.marvelapp.com/graphql)
    // retries: 0 — API tests must not retry: POST/mutation calls could create duplicate data.
    {
      name: "api",
      testDir: "./tests/api",
      retries: 0,
      use: {
        baseURL: "https://api.marvelapp.com",
        ignoreHTTPSErrors: true,
      },
    },

    // UI tests — depend on setup so auth state is always ready before tests run.
    // retries: 2 — UI tests tolerate flakiness from network and rendering timing.
    {
      name: "chromium",
      testDir: "./tests/UI",
      dependencies: ["setup"],
      retries: 2,
      use: {
        ...devices["Desktop Chromium"],
        baseURL: "https://en.wikipedia.org",
        storageState: AUTH_FILE,
        ignoreHTTPSErrors: true,
      },
    },

    // Cross-browser projects — enabled only when CROSS_BROWSER=true.
    // Kept opt-in so local runs and PR checks stay fast (Chromium only).
    // CI runs these on push to main via the test-ui-cross-browser job.
    ...(process.env.CROSS_BROWSER
      ? [
          {
            name: "firefox",
            testDir: "./tests/UI",
            dependencies: ["setup"],
            retries: 2,
            use: {
              ...devices["Desktop Firefox"],
              baseURL: "https://en.wikipedia.org",
              storageState: AUTH_FILE,
              ignoreHTTPSErrors: true,
            },
          },
          {
            name: "webkit",
            testDir: "./tests/UI",
            dependencies: ["setup"],
            retries: 2,
            use: {
              ...devices["Desktop Safari"],
              baseURL: "https://en.wikipedia.org",
              storageState: AUTH_FILE,
              ignoreHTTPSErrors: true,
            },
          },
        ]
      : []),
  ],
});
