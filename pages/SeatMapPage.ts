import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class SeatMapPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get seatMapContainer(): Locator {
    return this.page.locator('.seat-map, [data-testid="seat-map"], #seat-map, svg.seats');
  }

  get seatMapLegend(): Locator {
    return this.page.locator('.seat-legend, [data-testid="seat-legend"], .legend');
  }

  get availableSeats(): Locator {
    return this.page.locator('[data-status="available"], .seat--available, circle.available');
  }

  get soldSeats(): Locator {
    return this.page.locator('[data-status="sold"], .seat--sold, circle.sold, [data-status="blocked"]');
  }

  get selectedSeats(): Locator {
    return this.page.locator('[data-status="selected"], .seat--selected, circle.selected');
  }

  get selectionSummary(): Locator {
    return this.page.locator('.seat-summary, [data-testid="seat-summary"], .selection-summary');
  }

  get selectionTotal(): Locator {
    return this.page.locator('[data-testid="selection-total"], .summary-total, .cart-total');
  }

  get continueToCartBtn(): Locator {
    return this.page.locator('button:has-text("Продовжити"), button:has-text("Continue"), [data-testid="continue-to-cart"]');
  }

  async waitForSeatMapLoaded(): Promise<void> {
    await this.seatMapContainer.waitFor({ state: 'visible', timeout: 10_000 });
    await this.page.waitForLoadState('networkidle');
  }

  async selectSeat(index: number = 0): Promise<void> {
    await this.availableSeats.nth(index).click();
  }

  async selectMultipleSeats(count: number): Promise<void> {
    for (let i = 0; i < count; i++) {
      await this.availableSeats.nth(i).click();
    }
  }

  async deselect(index: number = 0): Promise<void> {
    await this.selectedSeats.nth(index).click();
  }

  async getSelectionCount(): Promise<number> {
    return this.selectedSeats.count();
  }

  async getTotalText(): Promise<string> {
    return (await this.selectionTotal.textContent()) ?? '';
  }

  async clickContinue(): Promise<void> {
    await this.continueToCartBtn.click();
    await this.page.waitForLoadState('domcontentloaded');
  }
}
