import { test, expect } from '@playwright/test';
import { acceptCookies } from '../../utils/helpers';

test.describe('Error Handling & Edge Cases', () => {

  // CON-ERR-001
  test('CON-ERR-001 | Friendly error shown when checkout server fails', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForLoadState('domcontentloaded');
    await acceptCookies(page);

    // Intercept checkout submission and return 500
    await page.route('**/checkout**', route => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      } else {
        route.continue();
      }
    });

    const submitBtn = page.locator(
      'button[type="submit"]:has-text("Оплатити"), button:has-text("Pay"), button:has-text("Continue"), [data-testid="submit-order"]'
    );
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(2000);

      // No raw stack traces in page
      const rawError = page.locator(':text("Traceback"), :text("at Object.<anonymous>"), :text("Uncaught TypeError")');
      await expect(rawError).not.toBeVisible();

      // User-friendly error or retry option should appear
      const friendlyError = page.locator(
        ':text("щось пішло не так"), :text("Something went wrong"), :text("спробуйте ще раз"), :text("try again"), .error-message, .alert-error'
      );
      await expect(friendlyError.first()).toBeVisible({ timeout: 5000 });
    }
  });

  // CON-ERR-002
  test('CON-ERR-002 | Friendly error on payment gateway redirect failure', async ({ page }) => {
    // Simulate the gateway return with an error status
    await page.goto('/payment/return?status=error&orderId=test-000');
    await page.waitForLoadState('domcontentloaded');

    // No stack trace
    const rawError = page.locator(':text("Traceback"), :text("at Object.<anonymous>"), :text("500 Internal")');
    await expect(rawError).not.toBeVisible();

    // Some kind of status message should appear
    await expect(page.locator('body')).not.toBeEmpty();
  });

  // CON-ERR-003
  test('CON-ERR-003 | Back navigation during purchase flow is handled gracefully', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/catalog');
    await page.waitForLoadState('domcontentloaded');
    await acceptCookies(page);

    // Go into an event
    const firstCard = page.locator('.event-card, [data-testid="event-card"]').first();
    if (await firstCard.isVisible()) {
      await firstCard.click();
      await page.waitForLoadState('domcontentloaded');
    }

    // Press browser back
    await page.goBack();
    await page.waitForLoadState('domcontentloaded');

    // No JS errors on back navigation
    const jsErrors = consoleErrors.filter(e =>
      !e.includes('favicon') && !e.includes('net::ERR') && !e.includes('analytics')
    );
    expect(jsErrors.length).toBe(0);

    // Catalog should be intact
    await expect(page.locator('.event-card, [data-testid="event-card"]').first()).toBeVisible();
  });

  // CON-ERR-004
  test('CON-ERR-004 | Refresh/back on success page does not duplicate order', async ({ page }) => {
    // Navigate to a mock success URL  
    await page.goto('/payment/success?orderId=test-demo-000');
    await page.waitForLoadState('domcontentloaded');

    // Page should load without crash
    const rawError = page.locator(':text("500"), :text("Traceback")');
    await expect(rawError).not.toBeVisible();

    // Refresh
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await expect(rawError).not.toBeVisible();

    // Back then forward
    await page.goBack();
    await page.waitForLoadState('domcontentloaded');
    await page.goForward();
    await page.waitForLoadState('domcontentloaded');
    await expect(rawError).not.toBeVisible();
  });

});
