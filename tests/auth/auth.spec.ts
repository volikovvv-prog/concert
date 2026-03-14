import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { RegisterPage } from '../../pages/RegisterPage';
import { acceptCookies } from '../../utils/helpers';
import { TEST_USER, INVALID_USER, NEW_USER } from '../../fixtures/testData';

test.describe('Authentication & Profile', () => {

  // CON-AUTH-001
  test('CON-AUTH-001 | Register new account with valid data', async ({ page }) => {
    const register = new RegisterPage(page);
    await register.open();
    await acceptCookies(page);

    await register.fillForm(NEW_USER.name, NEW_USER.email, NEW_USER.password);
    await register.acceptTerms();
    await register.submit();

    // Either logged in immediately or shown email verification prompt
    const successIndicators = page.locator(
      ':text("підтвердіть email"), :text("verify your email"), :text("реєстрація успішна"), .register-success, .profile-menu, [data-testid="profile-menu"]'
    );
    await expect(successIndicators.first()).toBeVisible({ timeout: 10_000 });
  });

  // CON-AUTH-002
  test('CON-AUTH-002 | Registration validation for empty fields and existing email', async ({ page }) => {
    const register = new RegisterPage(page);
    await register.open();
    await acceptCookies(page);

    // Submit empty form
    await register.submit();
    await page.waitForTimeout(500);
    const errors = await register.formErrors.count();
    expect(errors).toBeGreaterThan(0);

    // Try with already-registered email
    await register.fillForm(TEST_USER.name, TEST_USER.email, TEST_USER.password);
    await register.acceptTerms();
    await register.submit();
    await page.waitForLoadState('networkidle');

    const emailErr = page.locator(
      ':text("вже використовується"), :text("already registered"), :text("already exists"), [data-testid="register-email-error"]'
    );
    await expect(emailErr.first()).toBeVisible({ timeout: 5000 });
  });

  // CON-AUTH-003
  test('CON-AUTH-003 | Login with valid credentials', async ({ page }) => {
    const login = new LoginPage(page);
    await login.open();
    await acceptCookies(page);
    await login.login(TEST_USER.email, TEST_USER.password);

    await expect(login.profileMenu).toBeVisible({ timeout: 8000 });
    const loginError = await login.loginError.isVisible().catch(() => false);
    expect(loginError).toBeFalsy();
  });

  // CON-AUTH-004
  test('CON-AUTH-004 | Login with invalid credentials shows generic error', async ({ page }) => {
    const login = new LoginPage(page);
    await login.open();
    await acceptCookies(page);
    await login.login(TEST_USER.email, INVALID_USER.password);

    await expect(login.loginError).toBeVisible({ timeout: 5000 });

    // Should not disclose which field is wrong
    const loginErrorText = await login.loginError.textContent();
    expect(loginErrorText).not.toMatch(/password is wrong|incorrect password/i);
    expect(loginErrorText).not.toMatch(/email not found/i);

    // Not logged in
    const isLoggedIn = await login.isLoggedIn();
    expect(isLoggedIn).toBeFalsy();
  });

  // CON-AUTH-005
  test('CON-AUTH-005 | Logout ends session', async ({ page }) => {
    const login = new LoginPage(page);
    await login.open();
    await acceptCookies(page);
    await login.login(TEST_USER.email, TEST_USER.password);
    await expect(login.profileMenu).toBeVisible({ timeout: 8000 });

    await login.logout();

    // Profile menu should disappear, login option appears
    const loginLink = page.locator('a[href*="login"], a:has-text("Увійти"), a:has-text("Login"), [data-testid="login-link"]');
    await expect(loginLink.first()).toBeVisible({ timeout: 5000 });

    // Profile-only page should redirect
    await page.goto('/profile/orders');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/login|sign-in/);
  });

  // CON-AUTH-006
  test('CON-AUTH-006 | View past orders in profile', async ({ page }) => {
    const login = new LoginPage(page);
    await login.open();
    await acceptCookies(page);
    await login.login(TEST_USER.email, TEST_USER.password);
    await expect(login.profileMenu).toBeVisible({ timeout: 8000 });

    await page.goto('/profile/orders');
    await page.waitForLoadState('domcontentloaded');

    // Orders page should load with correct structure
    await expect(page).not.toHaveURL(/error/);
    const ordersContainer = page.locator('.orders-list, [data-testid="orders-list"], .profile-orders');
    await expect(ordersContainer).toBeVisible();
  });

  // CON-AUTH-007
  test('CON-AUTH-007 | Password reset flow', async ({ page }) => {
    const login = new LoginPage(page);
    await login.open();
    await acceptCookies(page);

    await login.forgotPasswordLink.click();
    await page.waitForLoadState('domcontentloaded');

    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await expect(emailInput).toBeVisible();

    await emailInput.fill(TEST_USER.email);
    const submitBtn = page.locator('button[type="submit"], button:has-text("Надіслати"), button:has-text("Send")');
    await submitBtn.click();
    await page.waitForLoadState('networkidle');

    // Success message: email was sent
    const successMsg = page.locator(
      ':text("лист надіслано"), :text("email sent"), :text("check your email"), [data-testid="reset-email-sent"]'
    );
    await expect(successMsg.first()).toBeVisible({ timeout: 8000 });
  });

});
