import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "../fixtures/test-fixtures";

test.describe("Accessibility @a11y @ui", () => {
  test("main page should have no critical WCAG violations", async ({
    page,
  }) => {
    await page.goto("/");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test("search results page should have no critical WCAG violations", async ({
    googleSearchPage,
  }) => {
    await googleSearchPage.search("Playwright");

    const { page } = googleSearchPage;
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
