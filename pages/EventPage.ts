import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class EventPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get eventTitle(): Locator {
    return this.page.locator('h1.event-title, [data-testid="event-title"], .event-details__title');
  }

  get eventDate(): Locator {
    return this.page.locator('[data-testid="event-date"], .event-date, .event-details__date');
  }

  get eventCity(): Locator {
    return this.page.locator('[data-testid="event-city"], .event-city, .event-details__city');
  }

  get eventVenue(): Locator {
    return this.page.locator('[data-testid="event-venue"], .event-venue, .event-details__venue');
  }

  get eventDescription(): Locator {
    return this.page.locator('[data-testid="event-description"], .event-description, .event-details__description');
  }

  get eventImages(): Locator {
    return this.page.locator('.event-poster img, [data-testid="event-image"], .event-details__image img');
  }

  get eventPrice(): Locator {
    return this.page.locator('[data-testid="event-price"], .event-price, .ticket-price');
  }

  get buyTicketButton(): Locator {
    return this.page.locator('button:has-text("Купити"), button:has-text("Buy"), [data-testid="buy-ticket-btn"]');
  }

  get chooseSeatsButton(): Locator {
    return this.page.locator('button:has-text("Обрати місця"), button:has-text("Choose seats"), [data-testid="choose-seats-btn"]');
  }

  get mapLink(): Locator {
    return this.page.locator('a[href*="maps"], a:has-text("Показати на карті"), a:has-text("Show on map"), [data-testid="venue-map-link"]');
  }

  get eventSchedule(): Locator {
    return this.page.locator('.event-dates-list, [data-testid="event-schedule"], .schedule-tabs');
  }

  get pastEventLabel(): Locator {
    return this.page.locator(':has-text("Подія завершилася"), :has-text("Event finished"), [data-testid="past-event-label"]');
  }

  async clickBuyTicket(): Promise<void> {
    await this.buyTicketButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async clickChooseSeats(): Promise<void> {
    await this.chooseSeatsButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async selectDate(date: string): Promise<void> {
    await this.page.locator(`.schedule-item:has-text("${date}"), [data-testid="schedule-date"]:has-text("${date}")`).click();
    await this.page.waitForLoadState('networkidle');
  }

  async isBuyButtonEnabled(): Promise<boolean> {
    const btn = this.buyTicketButton;
    return await btn.isEnabled();
  }
}
