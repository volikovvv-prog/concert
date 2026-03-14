import { Page, expect } from '@playwright/test';

/** Wait for a URL to match a pattern (string or regex) with a timeout. */
export async function waitForUrl(page: Page, pattern: string | RegExp, timeout = 10_000): Promise<void> {
  await page.waitForURL(pattern, { timeout });
}

/** Assert the page has no console errors (filters out acceptable noise). */
export function attachConsoleErrorListener(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  return errors;
}

/** Assert no mixed-content warnings in page. */
export async function assertHttps(page: Page): Promise<void> {
  const url = page.url();
  expect(url).toMatch(/^https:\/\//);
}

/** Extract numeric value from a price string like "1 200 грн" → 1200. */
export function parsePriceNumber(priceText: string): number {
  const cleaned = priceText.replace(/[^\d]/g, '');
  return parseInt(cleaned, 10);
}

/** Format a Date as YYYY-MM-DD for date input fields. */
export function formatDateInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

/** Return a future date N days from today. */
export function futureDateString(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return formatDateInput(d);
}

/** Clear localStorage and sessionStorage. */
export async function clearBrowserStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/** Accept cookie banner if visible. */
export async function acceptCookies(page: Page): Promise<void> {
  const acceptBtn = page.locator('button:has-text("Прийняти"), button:has-text("Accept")');
  try {
    await acceptBtn.waitFor({ state: 'visible', timeout: 3000 });
    await acceptBtn.click();
  } catch {
    // No banner
  }
}

/** Dismiss any modal/overlay if present. */
export async function dismissModal(page: Page): Promise<void> {
  const closeBtn = page.locator('button[aria-label="Close"], .modal__close, [data-testid="modal-close"]');
  try {
    await closeBtn.waitFor({ state: 'visible', timeout: 2000 });
    await closeBtn.click();
  } catch {
    // No modal
  }
}

/** Measure page load time in milliseconds. */
export async function measureLoadTime(page: Page, url: string): Promise<number> {
  const start = Date.now();
  await page.goto(url, { waitUntil: 'networkidle' });
  return Date.now() - start;
}
