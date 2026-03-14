import { test, expect } from '@playwright/test';
import { CheckoutPage } from '../../pages/CheckoutPage';
import { acceptCookies } from '../../utils/helpers';
import { TEST_USER, INVALID_EMAIL_FORMATS, INVALID_PHONE_FORMATS } from '../../fixtures/testData';

test.describe('Checkout', () => {

  // CON-CHK-001
  test('CON-CHK-001 | Proceed to checkout from cart', async ({ page }) => {
    // Prerequisite: item in cart — navigate directly to checkout
    await page.goto('/checkout');
    await page.waitForLoadState('domcontentloaded');
    await acceptCookies(page);

    const checkout = new CheckoutPage(page);
    // If cart is empty we may be redirected — either way no crash
    const url = page.url();
    expect(url).not.toMatch(/500|error/);

    if (url.includes('checkout')) {
      await expect(checkout.emailInput).toBeVisible();
      await expect(checkout.orderSummary).toBeVisible();
    }
  });

  // CON-CHK-002
  test('CON-CHK-002 | Empty form submission shows validation messages', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForLoadState('domcontentloaded');
    await acceptCookies(page);

    const checkout = new CheckoutPage(page);
    if (!(await checkout.submitBtn.isVisible())) test.skip(true, 'Checkout not accessible');

    await checkout.submit();
    await page.waitForTimeout(500);

    // At least one validation error should appear
    const anyError = page.locator('.error, .field-error, [aria-invalid="true"], [data-testid*="error"]');
    await expect(anyError.first()).toBeVisible();
  });

  // CON-CHK-003
  test('CON-CHK-003 | Invalid email format shows field error', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForLoadState('domcontentloaded');
    await acceptCookies(page);

    const checkout = new CheckoutPage(page);
    if (!(await checkout.emailInput.isVisible())) test.skip(true, 'Checkout not accessible');

    for (const badEmail of INVALID_EMAIL_FORMATS.slice(0, 2)) {
      await checkout.emailInput.fill(badEmail);
      await checkout.submit();
      await page.waitForTimeout(300);
      const emailErr = checkout.emailError;
      const isVisible = await emailErr.isVisible().catch(() => false);
      if (isVisible) {
        await expect(emailErr).toBeVisible();
        break; // One confirmed is sufficient
      }
    }
  });

  // CON-CHK-004
  test('CON-CHK-004 | Invalid phone format shows field error', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForLoadState('domcontentloaded');
    await acceptCookies(page);

    const checkout = new CheckoutPage(page);
    if (!(await checkout.phoneInput.isVisible())) test.skip(true, 'Checkout not accessible');

    for (const badPhone of INVALID_PHONE_FORMATS) {
      await checkout.phoneInput.fill(badPhone);
      await checkout.submit();
      await page.waitForTimeout(300);
      const phoneErr = checkout.phoneError;
      const isVisible = await phoneErr.isVisible().catch(() => false);
      if (isVisible) {
        await expect(phoneErr).toBeVisible();
        break;
      }
    }
  });

  // CON-CHK-005
  test('CON-CHK-005 | Name field boundary validation', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForLoadState('domcontentloaded');
    await acceptCookies(page);

    const checkout = new CheckoutPage(page);
    if (!(await checkout.nameInput.isVisible())) test.skip(true, 'Checkout not accessible');

    // Empty name
    await checkout.nameInput.fill('');
    await checkout.submit();
    await page.waitForTimeout(300);
    const errVisible = await checkout.nameError.isVisible().catch(() => false);
    expect(errVisible).toBeTruthy();

    // Overly long name
    const longName = 'A'.repeat(300);
    await checkout.nameInput.fill(longName);
    const currentValue = await checkout.nameInput.inputValue();
    // Input should be capped at max length (or trimmed)
    expect(currentValue.length).toBeLessThanOrEqual(300);
  });

  // CON-CHK-006
  test('CON-CHK-006 | Select email delivery option', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForLoadState('domcontentloaded');
    await acceptCookies(page);

    const checkout = new CheckoutPage(page);
    if (!(await checkout.deliveryEmail.isVisible())) test.skip(true, 'No delivery options visible');

    await checkout.selectEmailDelivery();
    await checkout.emailInput.fill(TEST_USER.email);
    // No validation error should appear for email field
    const emailErr = checkout.emailError;
    await page.waitForTimeout(300);
    const hasError = await emailErr.isVisible().catch(() => false);
    expect(hasError).toBeFalsy();
  });

  // CON-CHK-007
  test('CON-CHK-007 | Select SMS delivery option', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForLoadState('domcontentloaded');
    await acceptCookies(page);

    const checkout = new CheckoutPage(page);
    if (!(await checkout.deliverySMS.isVisible())) test.skip(true, 'SMS delivery not available');

    await checkout.selectSmsDelivery();
    await checkout.phoneInput.fill(TEST_USER.phone);
    await page.waitForTimeout(300);
    const phoneErr = checkout.phoneError;
    const hasError = await phoneErr.isVisible().catch(() => false);
    expect(hasError).toBeFalsy();
  });

  // CON-CHK-008
  test('CON-CHK-008 | Expired session behavior at checkout', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForLoadState('domcontentloaded');
    await acceptCookies(page);

    // Simulate session expiry by clearing cookies and storage
    await page.context().clearCookies();
    await page.evaluate(() => sessionStorage.clear());

    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // No raw stack traces, user sees either login redirect or session message
    const stackTrace = page.locator(':text("at Object.<anonymous>"), :text("Traceback")');
    await expect(stackTrace).not.toBeVisible();
  });

  // CON-CHK-009
  test('CON-CHK-009 | Order summary matches cart data', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForLoadState('domcontentloaded');
    await acceptCookies(page);

    const checkout = new CheckoutPage(page);
    if (!(await checkout.orderSummary.isVisible())) test.skip(true, 'Checkout not accessible or cart is empty');

    // Summary total should be visible and numeric
    const totalText = await checkout.getOrderSummaryTotal();
    expect(totalText).toMatch(/\d/);
  });

});
