import { Page, Locator } from "@playwright/test";

export class MessageHelpers {
  private static getMessageLocator(
    page: Page,
    type: "success" | "error",
  ): Locator {
    const pattern = type === "success" ? /success/i : /error/i;
    return page.getByRole("alert").filter({ hasText: pattern });
  }

  static async waitForMessage(
    page: Page,
    type: "success" | "error",
    timeout = 20000,
  ): Promise<void> {
    await this.getMessageLocator(page, type).waitFor({
      state: "visible",
      timeout,
    });
  }

  static async hasMessage(
    page: Page,
    type: "success" | "error",
    timeout = 2000,
  ): Promise<boolean> {
    try {
      await this.getMessageLocator(page, type).waitFor({
        state: "visible",
        timeout,
      });
      return true;
    } catch {
      return false;
    }
  }

  static async getMessage(
    page: Page,
    type: "success" | "error",
  ): Promise<string | null> {
    try {
      const locator = this.getMessageLocator(page, type);
      await locator
        .waitFor({ state: "visible", timeout: 1000 })
        .catch(() => {});
      return locator.textContent({ timeout: 500 });
    } catch {
      return null;
    }
  }

  static async dismissMessage(page: Page): Promise<void> {
    try {
      const closeButton = page
        .getByRole("alert")
        .first()
        .getByRole("button", { name: /close|dismiss/i });

      if (await closeButton.isVisible({ timeout: 500 }).catch(() => false)) {
        await closeButton.click();
      } else {
        await page.keyboard.press("Escape");
      }
    } catch {
      // message may auto-dismiss
    }
  }
}
