import { test as setup } from "@playwright/test";
import fs from "fs";
import path from "path";

export const AUTH_FILE = path.resolve(
  __dirname,
  "../../playwright/.auth/user.json",
);

setup("authenticate", async ({ page }) => {
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  // If no credentials are configured, save an empty storage state so
  // dependent projects can still run without authentication.
  const email = process.env.APP_EMAIL;
  const password = process.env.APP_PASSWORD;

  if (!email || !password) {
    await page.context().storageState({ path: AUTH_FILE });
    return;
  }

  // ----------------------------------------------------------------
  // Replace the block below with your app's actual login flow.
  // ----------------------------------------------------------------
  // await page.goto('/login');
  // await page.getByLabel('Email').fill(email);
  // await page.getByLabel('Password').fill(password);
  // await page.getByRole('button', { name: 'Sign in' }).click();
  // await page.waitForURL('**/dashboard');
  // ----------------------------------------------------------------

  // Persist cookies + localStorage so every test starts already logged in
  await page.context().storageState({ path: AUTH_FILE });
});
