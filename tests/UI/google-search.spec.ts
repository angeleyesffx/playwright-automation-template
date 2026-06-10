import { expect } from '@playwright/test';
import { test } from '../fixtures/test-fixtures';

test.describe('Wikipedia Search @smoke @ui', () => {
  test('should display search input on the main page', async ({ googleSearchPage }) => {
    await googleSearchPage.navigate();
    await expect(googleSearchPage.searchInput).toBeVisible();
  });

  test('should display results after searching', async ({ googleSearchPage }) => {
    await googleSearchPage.search('Playwright software');
    const count = await googleSearchPage.getResultCount();
    expect(count).toBeGreaterThan(0);
  });

  test('should include the query in the URL after search', async ({ googleSearchPage }) => {
    await googleSearchPage.search('TypeScript testing');
    expect(googleSearchPage.currentUrl()).toContain('search=TypeScript');
  });

  test('should return a non-empty title for the first result', async ({ googleSearchPage }) => {
    await googleSearchPage.search('Test automation');
    const title = await googleSearchPage.getFirstResultTitle();
    expect(title.length).toBeGreaterThan(0);
  });

  test('should reflect the new query after a second search', async ({ googleSearchPage }) => {
    // Wikipedia may redirect exact-match queries straight to the article,
    // so we accept either the Special:Search URL or a /wiki/ article URL.
    await googleSearchPage.search('JavaScript');
    expect(googleSearchPage.currentUrl()).toMatch(/search=JavaScript|\/wiki\/JavaScript/i);

    await googleSearchPage.search('TypeScript');
    expect(googleSearchPage.currentUrl()).toMatch(/search=TypeScript|\/wiki\/TypeScript/i);
  });
});
