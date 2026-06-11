import { expect } from '@playwright/test';
import { test } from '../fixtures/test-fixtures';

// ── Smoke ─────────────────────────────────────────────────────────────────
// Fast, independent tests that run on every PR.

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
});

// ── Equivalence partitioning — valid search queries ───────────────────────
// Fix #4: data-driven pattern using a for loop over equivalence classes.
// Each query represents a distinct valid input partition.

const VALID_QUERIES = [
  'JavaScript',
  'TypeScript',
  'Software testing',
  'Web automation',
] as const;

test.describe('Wikipedia Search — equivalence partitioning @ui', () => {
  for (const query of VALID_QUERIES) {
    test(`should return results for "${query}"`, async ({ googleSearchPage }) => {
      await googleSearchPage.search(query);
      const count = await googleSearchPage.getResultCount();
      expect(count).toBeGreaterThan(0);
    });
  }
});

// ── Negative tests ────────────────────────────────────────────────────────
// Fix #5: covers invalid and boundary input classes.

test.describe('Wikipedia Search — negative cases @ui', () => {
  test('should URL-encode special characters in the search query', async ({ googleSearchPage }) => {
    await googleSearchPage.search('C++ programming');
    // encodeURIComponent converts + to %2B — verifies GoogleSearchPage.search() encodes correctly
    expect(googleSearchPage.currentUrl()).toContain('C%2B%2B');
  });

  test('should display the results page for an unrecognised query', async ({ googleSearchPage }) => {
    // Verifies the page does not crash or show an error for a nonsense term
    await googleSearchPage.search('xkjq98zz_notarealword_fake9874');
    await expect(googleSearchPage.resultsContainer).toBeVisible();
  });

  test('should update the URL when performing a second consecutive search', async ({ googleSearchPage }) => {
    // Wikipedia may redirect exact-match queries straight to the article,
    // so we accept either the Special:Search URL or a /wiki/ article URL.
    await googleSearchPage.search('JavaScript');
    expect(googleSearchPage.currentUrl()).toMatch(/search=JavaScript|\/wiki\/JavaScript/i);

    await googleSearchPage.search('TypeScript');
    expect(googleSearchPage.currentUrl()).toMatch(/search=TypeScript|\/wiki\/TypeScript/i);
  });
});
