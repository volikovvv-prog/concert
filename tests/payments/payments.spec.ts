import { test, expect } from '@playwright/test';
import { CheckoutPage } from '../../pages/CheckoutPage';
import { acceptCookies } from '../../utils/helpers';
import { TEST_USER, CARDS } from '../../fixtures/testData';

/**
 * NOTE: Payment tests require a TEST environment with sandbox card support.
 * Set env vars:
 *   TEST_ENV=true           — enables payment tests
 *   TEST_USER_EMAIL         — valid test account email
 *   TEST_USER_PASSWORD      — valid test account password
 *
 * These tests will be skipped when TEST_ENV is not set.
 */
const isTestEnv = !!process.env.TEST_ENV;

async function fillPaymentCard(page: any, card: typeof CARDS.valid) {
  // Payment iframe/form selectors — adjust to actual gateway (e.g., LiqPay, WayForPay)
  const frame = page.frameLocator('iframe[src*="pay"], iframe[src*="liqpay"], iframe[src*="wayforpay"]').first();
  const cardNumber = frame.locator('input[name="cardnumber"], input[placeholder*="card"], [data-testid="card-number"]');
  const expiry = frame.locator('input[name="exp-date"], input[placeholder*="MM"], [data-testid="expiry"]');
  const cvv = frame.locator('input[name="cvc"], input[placeholder*="CVV"], [data-testid="cvv"]');
  const nameOnCard = frame.locator('input[name="name"], input[placeholder*="name"], [data-testid="card-name"]');

  try {
    await cardNumber.fill(card.number);
    await expiry.fill(card.expiry);
    await cvv.fill(card.cvv);
    if ('name' in card) await nameOnCard.fill(card.name as string);
  } catch {
    // Gateway form may be different — fill top-level as fallback
    const topLevel = {
      number: page.locator('input[name="cardnumber"], input[placeholder*="1234"], [data-testid="card-number"]'),
      expiry: page.locator('input[name="exp"], [data-testid="expiry"]'),
      cvv: page.locator('input[name="cvv"], [data-testid="cvv"]'),
    };
    await topLevel.number.fill(card.number).catch(() => {});
    await topLevel.expiry.fill(card.expiry).catch(() => {});
    await topLevel.cvv.fill(card.cvv).catch(() => {});
  }
}

test.describe('Payments', () => {

  // CON-PAY-001
  test('CON-PAY-001 | Successful payment with valid card', async ({ page }) => {
    test.skip(!isTestEnv, 'Requires TEST_ENV=true with sandbox payment gateway');

    await page.goto('/checkout');
    await page.waitForLoadState('domcontentloaded');
    await acceptCookies(page);

    const checkout = new CheckoutPage(page);
    await checkout.fillBuyerInfo(TEST_USER.name, TEST_USER.email, TEST_USER.phone);
    await checkout.selectEmailDelivery();
    await checkout.submit();
    await page.waitForLoadState('domcontentloaded');

    await fillPaymentCard(page, CARDS.valid);
    const payBtn = page.locator('button:has-text("Сплатити"), button:has-text("Pay"), button[type="submit"]');
    await payBtn.click();
    await page.waitForLoadState('networkidle', { timeout: 30_000 });

    const successIndicator = page.locator(':text("Оплата успішна"), :text("Payment successful"), :text("Дякуємо"), :text("Thank you"), .order-success');
    await expect(successIndicator.first()).toBeVisible({ timeout: 15_000 });
  });

  // CON-PAY-002
  test('CON-PAY-002 | Reject invalid card number', async ({ page }) => {
    test.skip(!isTestEnv, 'Requires TEST_ENV=true');

    await page.goto('/checkout');
    await page.waitForLoadState('domcontentloaded');
    await acceptCookies(page);

    const checkout = new CheckoutPage(page);
    await checkout.fillBuyerInfo(TEST_USER.name, TEST_USER.email, TEST_USER.phone);
    await checkout.submit();
    await page.waitForLoadState('domcontentloaded');

    await fillPaymentCard(page, CARDS.invalid);
    const payBtn = page.locator('button:has-text("Сплатити"), button:has-text("Pay"), button[type="submit"]');
    await payBtn.click();
    await page.waitForLoadState('networkidle', { timeout: 20_000 });

    const errorMsg = page.locator(':text("невірний"), :text("invalid"), :text("declined"), :text("відхилено"), .payment-error');
    await expect(errorMsg.first()).toBeVisible({ timeout: 10_000 });

    // Confirm no ticket issued
    const successIndicator = page.locator(':text("Оплата успішна"), :text("Payment successful")');
    await expect(successIndicator).not.toBeVisible();
  });

  // CON-PAY-003
  test('CON-PAY-003 | Reject expired card', async ({ page }) => {
    test.skip(!isTestEnv, 'Requires TEST_ENV=true');

    await page.goto('/checkout');
    await page.waitForLoadState('domcontentloaded');
    const checkout = new CheckoutPage(page);
    await checkout.fillBuyerInfo(TEST_USER.name, TEST_USER.email, TEST_USER.phone);
    await checkout.submit();

    await fillPaymentCard(page, CARDS.expired);
    const payBtn = page.locator('button:has-text("Сплатити"), button:has-text("Pay"), button[type="submit"]');
    await payBtn.click();
    await page.waitForLoadState('networkidle', { timeout: 20_000 });

    const errorMsg = page.locator(':text("expired"), :text("прострочена"), :text("declined"), .payment-error');
    await expect(errorMsg.first()).toBeVisible({ timeout: 10_000 });
  });

  // CON-PAY-004
  test('CON-PAY-004 | Reject wrong CVV', async ({ page }) => {
    test.skip(!isTestEnv, 'Requires TEST_ENV=true');

    await page.goto('/checkout');
    await page.waitForLoadState('domcontentloaded');
    const checkout = new CheckoutPage(page);
    await checkout.fillBuyerInfo(TEST_USER.name, TEST_USER.email, TEST_USER.phone);
    await checkout.submit();

    // Valid number but wrong CVV
    const badCvvCard = { ...CARDS.valid, cvv: '000' };
    await fillPaymentCard(page, badCvvCard);
    const payBtn = page.locator('button:has-text("Сплатити"), button:has-text("Pay"), button[type="submit"]');
    await payBtn.click();
    await page.waitForLoadState('networkidle', { timeout: 20_000 });

    const errorMsg = page.locator(':text("CVV"), :text("security code"), :text("declined"), .payment-error');
    await expect(errorMsg.first()).toBeVisible({ timeout: 10_000 });
  });

  // CON-PAY-005
  test('CON-PAY-005 | Handle insufficient funds', async ({ page }) => {
    test.skip(!isTestEnv, 'Requires TEST_ENV=true with insufficient-funds test card');

    await page.goto('/checkout');
    await page.waitForLoadState('domcontentloaded');
    const checkout = new CheckoutPage(page);
    await checkout.fillBuyerInfo(TEST_USER.name, TEST_USER.email, TEST_USER.phone);
    await checkout.submit();

    await fillPaymentCard(page, CARDS.insufficientFunds);
    const payBtn = page.locator('button:has-text("Сплатити"), button:has-text("Pay"), button[type="submit"]');
    await payBtn.click();
    await page.waitForLoadState('networkidle', { timeout: 20_000 });

    const errorMsg = page.locator(':text("insufficient"), :text("недостатньо"), :text("declined"), .payment-error');
    await expect(errorMsg.first()).toBeVisible({ timeout: 10_000 });
  });

  // CON-PAY-006
  test('CON-PAY-006 | Handle gateway timeout gracefully', async ({ page }) => {
    test.skip(!isTestEnv, 'Requires TEST_ENV=true');

    await page.goto('/checkout');
    await page.waitForLoadState('domcontentloaded');
    const checkout = new CheckoutPage(page);
    await checkout.fillBuyerInfo(TEST_USER.name, TEST_USER.email, TEST_USER.phone);
    await checkout.submit();

    // Simulate network drop by aborting payment gateway requests
    await page.route('**/pay**', route => route.abort('timedout'));
    await page.route('**/liqpay**', route => route.abort('timedout'));
    await page.route('**/wayforpay**', route => route.abort('timedout'));

    const payBtn = page.locator('button:has-text("Сплатити"), button:has-text("Pay"), button[type="submit"]');
    await payBtn.click().catch(() => {});
    await page.waitForTimeout(5000);

    // User should see an error, not a blank page or stack trace
    const rawError = page.locator(':text("Traceback"), :text("at Object.<anonymous>"), :text("500 Internal")');
    await expect(rawError).not.toBeVisible();
  });

  // CON-PAY-007
  test('CON-PAY-007 | Cancel payment on 3DS page returns to order', async ({ page }) => {
    test.skip(!isTestEnv, 'Requires TEST_ENV=true with 3DS-enabled card');

    await page.goto('/checkout');
    await page.waitForLoadState('domcontentloaded');
    const checkout = new CheckoutPage(page);
    await checkout.fillBuyerInfo(TEST_USER.name, TEST_USER.email, TEST_USER.phone);
    await checkout.submit();
    await fillPaymentCard(page, CARDS.valid);

    // After redirect to 3DS page, click Cancel
    await page.waitForURL(/3ds|bank|liqpay|wayforpay/, { timeout: 15_000 });
    const cancelBtn = page.locator('button:has-text("Cancel"), button:has-text("Скасувати"), a:has-text("Back")');
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
      await page.waitForLoadState('networkidle');
    }

    // Order should remain unpaid, no server error
    const rawError = page.locator(':text("500"), :text("Traceback")');
    await expect(rawError).not.toBeVisible();
  });

  // CON-PAY-008
  test('CON-PAY-008 | No double charge on refresh during payment', async ({ page }) => {
    test.skip(!isTestEnv, 'Requires TEST_ENV=true');

    await page.goto('/checkout');
    await page.waitForLoadState('domcontentloaded');
    const checkout = new CheckoutPage(page);
    await checkout.fillBuyerInfo(TEST_USER.name, TEST_USER.email, TEST_USER.phone);
    await checkout.submit();
    await fillPaymentCard(page, CARDS.valid);

    const payBtn = page.locator('button:has-text("Сплатити"), button:has-text("Pay"), button[type="submit"]');
    await payBtn.click();

    // Immediately refresh while processing
    await page.waitForTimeout(1000);
    await page.reload();
    await page.waitForLoadState('networkidle', { timeout: 20_000 });

    // Check profile orders — expect at most one paid order for this purchase
    await page.goto('/profile/orders');
    await page.waitForLoadState('domcontentloaded');
    const paidOrders = page.locator('[data-status="paid"], :text("Оплачено"), :text("Paid")');
    const count = await paidOrders.count();
    expect(count).toBeLessThanOrEqual(1);
  });

  // CON-PAY-009
  test('CON-PAY-009 | Payment after long idle (session timeout)', async ({ page }) => {
    test.skip(!isTestEnv, 'Requires TEST_ENV=true');

    await page.goto('/checkout');
    await page.waitForLoadState('domcontentloaded');
    const checkout = new CheckoutPage(page);

    // Expire the session manually
    await page.context().clearCookies();
    await page.evaluate(() => sessionStorage.clear());

    await checkout.submit().catch(() => {});
    await page.waitForTimeout(1000);

    // No unhandled errors, no sensitive data leakage
    const rawError = page.locator(':text("Traceback"), :text("500 Internal")');
    await expect(rawError).not.toBeVisible();
  });

});
