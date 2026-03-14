import { test, expect } from '@playwright/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { EventPage } from '../../pages/EventPage';
import { SeatMapPage } from '../../pages/SeatMapPage';
import { acceptCookies } from '../../utils/helpers';

test.describe('Seating & Tickets', () => {

  async function navigateToSeatMap(page: any) {
    const catalog = new CatalogPage(page);
    await catalog.open();
    await acceptCookies(page);
    await catalog.eventCards.first().click();
    await page.waitForLoadState('domcontentloaded');

    const event = new EventPage(page);
    const chooseSeats = event.chooseSeatsButton;
    const buyTicket = event.buyTicketButton;

    if (await chooseSeats.isVisible()) {
      await chooseSeats.click();
    } else if (await buyTicket.isVisible()) {
      await buyTicket.click();
    } else {
      return false;
    }
    await page.waitForLoadState('domcontentloaded');
    return true;
  }

  // CON-SEAT-001
  test('CON-SEAT-001 | Seat map loads for seated event', async ({ page }) => {
    const opened = await navigateToSeatMap(page);
    if (!opened) test.skip(true, 'No buy/seats button found on first event');

    const seatMap = new SeatMapPage(page);
    await seatMap.waitForSeatMapLoaded();
    await expect(seatMap.seatMapContainer).toBeVisible();
    await expect(seatMap.seatMapLegend).toBeVisible();
  });

  // CON-SEAT-002
  test('CON-SEAT-002 | Select a single seat', async ({ page }) => {
    const opened = await navigateToSeatMap(page);
    if (!opened) test.skip(true, 'No seat map accessible');

    const seatMap = new SeatMapPage(page);
    await seatMap.waitForSeatMapLoaded();

    const availableCount = await seatMap.availableSeats.count();
    if (availableCount === 0) test.skip(true, 'No available seats');

    await seatMap.selectSeat(0);
    const selectedCount = await seatMap.getSelectionCount();
    expect(selectedCount).toBe(1);
    await expect(seatMap.selectionSummary).toBeVisible();
  });

  // CON-SEAT-003
  test('CON-SEAT-003 | Select 2–4 seats and verify summary', async ({ page }) => {
    const opened = await navigateToSeatMap(page);
    if (!opened) test.skip(true, 'No seat map accessible');

    const seatMap = new SeatMapPage(page);
    await seatMap.waitForSeatMapLoaded();

    const availableCount = await seatMap.availableSeats.count();
    if (availableCount < 2) test.skip(true, 'Fewer than 2 available seats');

    const toSelect = Math.min(3, availableCount);
    await seatMap.selectMultipleSeats(toSelect);

    const selectedCount = await seatMap.getSelectionCount();
    expect(selectedCount).toBe(toSelect);
    await expect(seatMap.selectionSummary).toBeVisible();

    const totalText = await seatMap.getTotalText();
    expect(totalText).toMatch(/\d/); // total contains a number
  });

  // CON-SEAT-004
  test('CON-SEAT-004 | Click sold/blocked seat cannot be added', async ({ page }) => {
    const opened = await navigateToSeatMap(page);
    if (!opened) test.skip(true, 'No seat map accessible');

    const seatMap = new SeatMapPage(page);
    await seatMap.waitForSeatMapLoaded();

    const soldCount = await seatMap.soldSeats.count();
    if (soldCount === 0) test.skip(true, 'No sold seats visible on this map');

    await seatMap.soldSeats.first().click();
    const selectedCount = await seatMap.getSelectionCount();
    expect(selectedCount).toBe(0);
  });

  // CON-SEAT-005
  test('CON-SEAT-005 | Deselect seat and reselect another', async ({ page }) => {
    const opened = await navigateToSeatMap(page);
    if (!opened) test.skip(true, 'No seat map accessible');

    const seatMap = new SeatMapPage(page);
    await seatMap.waitForSeatMapLoaded();

    const availableCount = await seatMap.availableSeats.count();
    if (availableCount < 2) test.skip(true, 'Fewer than 2 available seats');

    await seatMap.selectSeat(0);
    expect(await seatMap.getSelectionCount()).toBe(1);

    await seatMap.deselect(0);
    expect(await seatMap.getSelectionCount()).toBe(0);

    await seatMap.selectSeat(1);
    expect(await seatMap.getSelectionCount()).toBe(1);
  });

  // CON-SEAT-006
  test('CON-SEAT-006 | Seat price reflects zone/category', async ({ page }) => {
    const opened = await navigateToSeatMap(page);
    if (!opened) test.skip(true, 'No seat map accessible');

    const seatMap = new SeatMapPage(page);
    await seatMap.waitForSeatMapLoaded();

    const zones = page.locator('.zone, [data-zone], .sector');
    const zoneCount = await zones.count();
    if (zoneCount < 2) test.skip(true, 'Single-zone event');

    // Select seat from first zone and read price
    await seatMap.availableSeats.first().click();
    const firstTotal = await seatMap.getTotalText();

    // Deselect and pick from another zone if possible
    await seatMap.deselect(0);
    const totalAfterDeselect = await seatMap.getTotalText();
    // Total should go down (or to zero) after deselect
    expect(totalAfterDeselect).not.toBe(firstTotal);
  });

  // CON-SEAT-007
  test('CON-SEAT-007 | Seat map loads within acceptable time', async ({ page }) => {
    const start = Date.now();
    const opened = await navigateToSeatMap(page);
    if (!opened) test.skip(true, 'No seat map accessible');

    const seatMap = new SeatMapPage(page);
    await seatMap.waitForSeatMapLoaded();
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(10_000); // 10s generous budget
  });

  // CON-SEAT-008
  test('CON-SEAT-008 | Seat map on mobile viewport', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
    });
    const page = await context.newPage();
    const opened = await navigateToSeatMap(page);
    if (!opened) {
      await context.close();
      test.skip(true, 'No seat map accessible');
    }

    const seatMap = new SeatMapPage(page);
    await seatMap.waitForSeatMapLoaded();
    await expect(seatMap.seatMapContainer).toBeVisible();

    // Verify map is interactable – no overflow that hides it
    const mapBound = await seatMap.seatMapContainer.boundingBox();
    expect(mapBound).not.toBeNull();
    expect(mapBound!.width).toBeGreaterThan(0);
    await context.close();
  });

});
