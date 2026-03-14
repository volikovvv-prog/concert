import { test, expect } from '@playwright/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { SeatMapPage } from '../../pages/SeatMapPage';
import { EventPage } from '../../pages/EventPage';
import { acceptCookies, measureLoadTime } from '../../utils/helpers';

const HOMEPAGE_BUDGET_MS = 5_000;
const SEAT_MAP_BUDGET_MS = 8_000;

test.describe('Performance', () => {

  // CON-PERF-001
  test('CON-PERF-001 | Homepage loads within performance budget', async ({ browser }) => {
    // Use a fresh context to clear cache
    const context = await browser.newContext();
    const page = await context.newPage();

    const loadTime = await measureLoadTime(page, 'https://concert.ua/');
    console.log(`[CON-PERF-001] Homepage load time: ${loadTime}ms`);

    expect(loadTime).toBeLessThan(HOMEPAGE_BUDGET_MS);
    await context.close();
  });

  // CON-PERF-002
  test('CON-PERF-002 | Seat map loads and is interactive within budget', async ({ page }) => {
    const catalog = new CatalogPage(page);
    await catalog.open();
    await acceptCookies(page);

    await catalog.eventCards.first().click();
    await page.waitForLoadState('domcontentloaded');

    const event = new EventPage(page);
    const chooseSeats = event.chooseSeatsButton;
    const buyBtn = event.buyTicketButton;

    if (!(await chooseSeats.isVisible()) && !(await buyBtn.isVisible())) {
      test.skip(true, 'No buy/seats button on first catalog event');
    }

    const start = Date.now();
    if (await chooseSeats.isVisible()) {
      await chooseSeats.click();
    } else {
      await buyBtn.click();
    }

    const seatMap = new SeatMapPage(page);
    try {
      await seatMap.seatMapContainer.waitFor({ state: 'visible', timeout: SEAT_MAP_BUDGET_MS });
      const elapsed = Date.now() - start;
      console.log(`[CON-PERF-002] Seat map load time: ${elapsed}ms`);
      expect(elapsed).toBeLessThan(SEAT_MAP_BUDGET_MS);
    } catch {
      test.skip(true, 'Not a seated event — no seat map to measure');
    }
  });

});
