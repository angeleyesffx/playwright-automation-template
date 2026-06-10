import { Page, Locator } from '@playwright/test';
import { BasePage } from './base/base-page';

export class GoogleSearchPage extends BasePage {
  readonly searchInput: Locator;
  readonly resultsContainer: Locator;
  readonly resultHeadings: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.locator('#searchInput, input[name="search"]').first();
    this.resultsContainer = page.locator('.mw-search-results, #mw-content-text').first();
    this.resultHeadings = page.locator('.mw-search-result-heading a, #firstHeading');
  }

  async navigate(): Promise<void> {
    await this.page.goto('/wiki/Main_Page');
    await this.waitForVisible(this.searchInput);
  }

  async search(query: string): Promise<void> {
    await this.page.goto(`/wiki/Special:Search?search=${encodeURIComponent(query)}&ns0=1`);
    await this.waitForVisible(this.resultsContainer);
  }

  async getResultCount(): Promise<number> {
    return this.resultHeadings.count();
  }

  async getFirstResultTitle(): Promise<string> {
    return (await this.resultHeadings.first().textContent()) ?? '';
  }
}
