import { defineConfig, devices } from '@playwright/test';
import { loadProjectConfig } from './config/load-config';

loadProjectConfig();

const AUTH_FILE = 'playwright/.auth/user.json';

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 2,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['./scripts/custom-reporter.ts'],
    ['html'],
    ['line'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  timeout: 30000,
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  projects: [
    // Runs once before all UI projects — logs in and saves storage state.
    // If APP_EMAIL / APP_PASSWORD are not set, saves an empty state so UI
    // tests still run (unauthenticated). See tests/auth/auth.setup.ts.
    {
      name: 'setup',
      testMatch: '**/auth/auth.setup.ts',
      use: { baseURL: process.env.APP_BASE_URL ?? 'https://en.wikipedia.org' },
    },

    // Marvel App API tests (GraphQL — https://api.marvelapp.com/graphql)
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: 'https://api.marvelapp.com',
        ignoreHTTPSErrors: true,
      },
    },

    // UI tests — depend on setup so auth state is always ready before tests run.
    {
      name: 'chromium',
      testDir: './tests/UI',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chromium'],
        baseURL: 'https://en.wikipedia.org',
        storageState: AUTH_FILE,
        ignoreHTTPSErrors: true,
      },
    },
  ],
});
