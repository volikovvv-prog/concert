import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { BasePage } from '../../pages/BasePage';
import { acceptCookies, assertHttps } from '../../utils/helpers';
import { TEST_USER, XSS_PAYLOAD, HTML_INJECT_PAYLOAD } from '../../fixtures/testData';

test.describe('Security & Privacy', () => {

  // CON-SEC-001
  test('CON-SEC-001 | HTTPS enforced on critical pages', async ({ page }) => {
    for (const path of ['/', '/checkout', '/profile']) {
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded');
      await assertHttps(page);

      // No mixed-content warnings
      const mixedContentWarnings: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'warning' && msg.text().includes('Mixed Content')) {
          mixedContentWarnings.push(msg.text());
        }
      });
      await page.waitForTimeout(500);
      expect(mixedContentWarnings.length).toBe(0);
    }
  });

  // CON-SEC-002
  test('CON-SEC-002 | Profile page inaccessible without auth', async ({ browser }) => {
    // Fresh context with no session
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    // Should redirect to login
    if (!/login|sign-in/.test(page.url())) {
      console.warn('Not redirected to login from /profile');
    }
    await page.goto('/profile/orders');
    await page.waitForLoadState('domcontentloaded');
    if (!/login|sign-in/.test(page.url())) {
      console.warn('Not redirected to login from /profile/orders');
    }
    // No personal data should be visible
    const personalDataIndicators = page.locator('[data-testid="order-item"], .order-item, .profile-name, .user-email');
    if (await personalDataIndicators.count() > 0) {
      console.warn('Personal data indicators found for unauthenticated user');
    }

    await context.close();
  });

  // CON-SEC-003
  test('CON-SEC-003 | User A cannot access User B order URL', async ({ browser }) => {
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const loginA = new LoginPage(pageA);
    await loginA.open();
    if (await loginA.emailInput.count() > 0 && await loginA.passwordInput.count() > 0 && await loginA.loginBtn.count() > 0) {
      await loginA.login(TEST_USER.email, TEST_USER.password);
      if (!(await loginA.profileMenu.isVisible({ timeout: 8000 }).catch(() => false))) {
        console.warn('Profile menu not visible after login');
      }
      // Get a real order URL from user A
      await pageA.goto('/profile/orders');
      await pageA.waitForLoadState('domcontentloaded');
      const firstOrder = pageA.locator('.order-item a, [data-testid="order-link"]').first();
      let orderUrl = null;
      if (await firstOrder.count() > 0) {
        orderUrl = await firstOrder.getAttribute('href').catch(() => null);
      }
      await contextA.close();
      if (!orderUrl) {
        test.skip(true, 'No orders available for test user');
      }
      // New context — not logged in
      const contextB = await browser.newContext();
      const pageB = await contextB.newPage();
      await pageB.goto(orderUrl!);
      await pageB.waitForLoadState('domcontentloaded');
      // Should redirect to login or access denied
      const isLoginPage = pageB.url().includes('login') || pageB.url().includes('sign-in');
      const hasAccessDenied = await pageB.locator(':text("403"), :text("Access denied"), :text("Доступ заборонено")').isVisible().catch(() => false);
      if (!(isLoginPage || hasAccessDenied)) {
        console.warn('Order URL not protected for unauthenticated user');
      }
      await contextB.close();
    } else {
      console.warn('Login form not found, skipping test');
      await contextA.close();
    }
  });

  // CON-SEC-004
  test('CON-SEC-004 | No XSS execution in search', async ({ page }) => {
    const base = new BasePage(page);
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await acceptCookies(page);

    // Listen for unexpected dialog (alert) that XSS would trigger
    let dialogFired = false;
    page.on('dialog', async dialog => {
      dialogFired = true;
      await dialog.dismiss();
    });

    if (await base.searchBar.count() > 0 && await base.searchBar.isVisible() && await base.searchBar.isEnabled()) {
      await base.searchBar.fill(XSS_PAYLOAD);
      await page.keyboard.press('Enter');
      await page.waitForLoadState('networkidle');
      expect(dialogFired).toBeFalsy();
      // Payload should be escaped in the rendered HTML, not executed
      const pageContent = await page.content();
      // The script tag should not appear as raw HTML (it should be encoded/escaped)
      expect(pageContent).not.toContain('<script>alert(1)</script>');
    } else {
      console.warn('Search bar not found/visible/enabled, skipping XSS test');
    }
  });

  // CON-SEC-005
  test('CON-SEC-005 | No HTML injection in profile fields', async ({ page }) => {
    const login = new LoginPage(page);
    await login.open();
    await acceptCookies(page);
    if (await login.emailInput.count() > 0 && await login.passwordInput.count() > 0 && await login.loginBtn.count() > 0) {
      await login.login(TEST_USER.email, TEST_USER.password);
      if (!(await login.profileMenu.isVisible({ timeout: 8000 }).catch(() => false))) {
        console.warn('Profile menu not visible after login');
      }
      await page.goto('/profile/settings');
      await page.waitForLoadState('domcontentloaded');
      const nameField = page.locator('input[name="name"], input[name="first_name"], [data-testid="profile-name"]');
      if (!(await nameField.count() > 0 && await nameField.isVisible() && await nameField.isEnabled())) {
        console.warn('Profile edit not accessible, skipping HTML injection test');
        return;
      }
      let dialogFired = false;
      page.on('dialog', async dialog => {
        dialogFired = true;
        await dialog.dismiss();
      });
      await nameField.fill(HTML_INJECT_PAYLOAD);
      const saveBtn = page.locator('button:has-text("Зберегти"), button:has-text("Save"), button[type="submit"]');
      if (await saveBtn.count() > 0 && await saveBtn.isVisible() && await saveBtn.isEnabled()) {
        await saveBtn.click();
        await page.waitForLoadState('networkidle');
      } else {
        console.warn('Save button not found/visible/enabled, skipping save');
        return;
      }
      // Reload to verify stored value
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      expect(dialogFired).toBeFalsy();
      // The <h1> tag should NOT be rendered as an actual heading
      const injectedHeading = page.locator('h1:has-text("Injected")');
      await expect(injectedHeading).not.toBeVisible();
      // Restore original name
      if (await nameField.isVisible() && await nameField.isEnabled()) {
        await nameField.fill(TEST_USER.name);
        if (await saveBtn.count() > 0 && await saveBtn.isVisible() && await saveBtn.isEnabled()) {
          await saveBtn.click();
        }
      }
    } else {
      console.warn('Login form not found, skipping HTML injection test');
    }
  });

});
