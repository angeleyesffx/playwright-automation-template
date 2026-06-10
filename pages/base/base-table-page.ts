import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class BaseTablePage extends BasePage {
  readonly searchField: Locator;
  readonly nextPageButton: Locator;
  readonly previousPageButton: Locator;

  constructor(page: Page) {
    super(page);
    this.searchField = page.getByRole('searchbox');
    this.nextPageButton = page.getByRole('button', { name: /next page/i });
    this.previousPageButton = page.getByRole('button', { name: /previous page/i });
  }

  async search(text: string): Promise<void> {
    await expect(this.searchField).toBeVisible({ timeout: 15000 });
    await this.searchField.fill(text);
  }

  async goToNextPage(): Promise<void> {
    if (await this.nextPageButton.isEnabled()) {
      await this.nextPageButton.click();
    }
  }

  async goToPreviousPage(): Promise<void> {
    if (await this.previousPageButton.isEnabled()) {
      await this.previousPageButton.click();
    }
  }

  async getTableRowCount(): Promise<number> {
    const rows = this.page.locator('[role="row"]');
    const total = await rows.count();
    return Math.max(0, total - 1); // exclude header row
  }

  async getTableColumnHeaders(): Promise<string[]> {
    const headers = this.page.locator('[role="columnheader"]');
    const count = await headers.count();
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await headers.nth(i).textContent();
      if (text?.trim()) names.push(text.trim());
    }
    return names;
  }

  async getRowCellValues(rowIndex: number): Promise<string[]> {
    const row = this.page.locator(`[role="row"]`).nth(rowIndex);
    const cells = row.locator('[role="cell"], [role="gridcell"]');
    const count = await cells.count();
    const values: string[] = [];
    for (let i = 0; i < count; i++) {
      values.push((await cells.nth(i).textContent())?.trim() ?? '');
    }
    return values;
  }

  async getAllTableRows(): Promise<Array<Record<string, string>>> {
    const headers = await this.getTableColumnHeaders();
    const rowCount = await this.getTableRowCount();
    const rows: Array<Record<string, string>> = [];

    for (let i = 1; i <= rowCount; i++) {
      const cells = await this.getRowCellValues(i);
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = cells[idx] ?? ''; });
      rows.push(row);
    }

    return rows;
  }
}
