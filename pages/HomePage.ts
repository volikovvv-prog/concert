import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get featuredEventsBlock(): Locator {
    return this.page.locator('.featured-events, [data-testid="featured-events"], .main-events');
  }

  get categoriesBlock(): Locator {
    return this.page.locator('.categories, [data-testid="categories"], .home-categories');
  }

  get headerBlock(): Locator {
    return this.page.locator('header, .header');
  }

  get cityInHeader(): Locator {
    return this.page.locator('.header__city-name, [data-testid="current-city"], .current-city');
  }

  get cityDropdownOptions(): Locator {
    return this.page.locator('.city-list li, .city-dropdown__item, [data-testid="city-option"]');
  }

  async open(): Promise<void> {
    await this.page.goto('/');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async openCitySelector(): Promise<void> {
    await this.citySelector.click();
    await this.cityDropdownOptions.first().waitFor({ state: 'visible' });
  }

  async selectCity(cityName: string): Promise<void> {
    await this.openCitySelector();
    await this.page.locator(`.city-list li:has-text("${cityName}"), [data-testid="city-option"]:has-text("${cityName}")`).click();
    await this.page.waitForLoadState('networkidle');
  }

  async getSelectedCity(): Promise<string> {
    return (await this.cityInHeader.textContent()) ?? '';
  }
}
