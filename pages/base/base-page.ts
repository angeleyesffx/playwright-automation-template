import { Page, Locator, expect } from "@playwright/test";

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(path: string): Promise<void> {
    await this.page.goto(path);
  }

  async scrollIntoView(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded().catch(() => {});
  }

  async fillField(locator: Locator, value: string): Promise<void> {
    await this.scrollIntoView(locator);
    await locator.fill(value);
    await expect(locator).toHaveValue(value);
  }

  async validateFieldValue(
    locator: Locator,
    expectedValue: string,
  ): Promise<void> {
    await this.scrollIntoView(locator);
    await expect(locator).toHaveValue(expectedValue);
  }

  async waitForVisible(locator: Locator, timeout = 15000): Promise<void> {
    await locator.waitFor({ state: "visible", timeout });
  }

  currentUrl(): string {
    return this.page.url();
  }
}
