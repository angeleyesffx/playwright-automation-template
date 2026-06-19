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
    page,
  }) => {
    // Use fulltext=1 to force the search results list page and prevent Wikipedia
    // from redirecting to an article (article content has third-party violations
    // in images and navboxes that are outside our control).
    await page.goto(
      "/wiki/Special:Search?search=playwright+automation&fulltext=1&ns0=1",
    );

    // Scope to search UI elements only — article body content (#mw-content-text)
    // may contain user-submitted images and embedded widgets with violations
    // unrelated to the search feature being tested.
    const results = await new AxeBuilder({ page })
      .include(["#searchform", ".searchresults", ".mw-search-results-info"])
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
