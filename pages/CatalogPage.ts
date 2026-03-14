import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class CatalogPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get eventCards(): Locator {
    return this.page.locator('.event-card, [data-testid="event-card"], .catalog-item');
  }

  get filterPanel(): Locator {
    return this.page.locator('.filters, [data-testid="filter-panel"], .catalog-filters');
  }

  get cityFilter(): Locator {
    return this.page.locator('[data-testid="filter-city"], .filter-city, select[name="city"]');
  }

  get dateFilter(): Locator {
    return this.page.locator('[data-testid="filter-date"], .filter-date, input[name="date"]');
  }

  get dateFromInput(): Locator {
    return this.page.locator('[data-testid="date-from"], input[name="date_from"], .date-range__from');
  }

  get dateToInput(): Locator {
    return this.page.locator('[data-testid="date-to"], input[name="date_to"], .date-range__to');
  }

  get categoryFilter(): Locator {
    return this.page.locator('[data-testid="filter-category"], .filter-category, select[name="category"]');
  }

  get applyFiltersBtn(): Locator {
    return this.page.locator('button:has-text("Застосувати"), button:has-text("Apply"), [data-testid="apply-filters"]');
  }

  get clearFiltersBtn(): Locator {
    return this.page.locator('button:has-text("Очистити"), button:has-text("Clear"), [data-testid="clear-filters"]');
  }

  get activeFilterTags(): Locator {
    return this.page.locator('.filter-tag, [data-testid="active-filter"], .active-filter');
  }

  get sortControl(): Locator {
    return this.page.locator('select[name="sort"], [data-testid="sort-select"], .sort-dropdown');
  }

  get noResultsMessage(): Locator {
    return this.page.locator('.no-results, [data-testid="no-results"], :has-text("не знайдено"), :has-text("No results")');
  }

  async open(): Promise<void> {
    await this.page.goto('/catalog');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async filterByCity(city: string): Promise<void> {
    await this.cityFilter.click();
    await this.page.locator(`option:has-text("${city}"), li:has-text("${city}")`).first().click();
    await this.applyFiltersBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async filterByDateRange(from: string, to: string): Promise<void> {
    await this.dateFromInput.fill(from);
    await this.dateToInput.fill(to);
    await this.applyFiltersBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async filterByCategory(category: string): Promise<void> {
    await this.categoryFilter.click();
    await this.page.locator(`option:has-text("${category}"), li:has-text("${category}")`).first().click();
    await this.applyFiltersBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async clearAllFilters(): Promise<void> {
    await this.clearFiltersBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async sortBy(option: string): Promise<void> {
    await this.sortControl.selectOption({ label: option });
    await this.page.waitForLoadState('networkidle');
  }

  async getFirstEventTitle(): Promise<string> {
    return (await this.eventCards.first().locator('.event-title, h2, h3').textContent()) ?? '';
  }
}
