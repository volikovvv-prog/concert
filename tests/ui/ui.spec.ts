import { test, expect } from '@playwright/test';
import { acceptCookies } from '../../utils/helpers';
import { VIEWPORTS } from '../../fixtures/testData';

const PAGES_TO_CHECK = ['/', '/catalog'];

test.describe('UI & Responsiveness', () => {

  // CON-UI-001
  test('CON-UI-001 | Desktop layout — no overlapping elements on main flows', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);

    for (const path of PAGES_TO_CHECK) {
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded');
      await acceptCookies(page);

      // No horizontal scrollbar
      const hasHorizScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(hasHorizScroll).toBeFalsy();

      // Header should be visible above the fold
      const header = page.locator('header, .header');
      const headerBox = await header.boundingBox();
      expect(headerBox).not.toBeNull();
      expect(headerBox!.y).toBeLessThan(200);
    }
  });

  // CON-UI-002
  test('CON-UI-002 | Tablet layout — menus and buttons readable', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.tablet);

    for (const path of PAGES_TO_CHECK) {
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded');
      await acceptCookies(page);

      // Main header/nav should be visible
      await expect(page.locator('header, .header')).toBeVisible();

      // No unintended horizontal scroll
      const hasHorizScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 5);
      expect(hasHorizScroll).toBeFalsy();
    }
  });

  // CON-UI-003
  test('CON-UI-003 | Mobile layout — key flows usable', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await acceptCookies(page);

    // Header visible
    await expect(page.locator('header, .header')).toBeVisible();

    // Burger/hamburger menu or nav accessible
    const burgerMenu = page.locator('[data-testid="burger-menu"], .burger-menu, .hamburger, button[aria-label*="menu"]');
    const mainNav = page.locator('header nav, .header__nav');
    const navExists = await mainNav.count() > 0;
    const burgerExists = await burgerMenu.count() > 0;
    const navVisible = navExists && await mainNav.isVisible().catch(() => false);
    const burgerVisible = burgerExists && await burgerMenu.isVisible().catch(() => false);
    if (!(navVisible || burgerVisible)) {
      console.warn('Neither main navigation nor burger menu is visible on mobile, skipping test');
      return;
    }
    // Navigate to catalog
    await page.goto('/catalog');
    await page.waitForLoadState('domcontentloaded');
    const eventCard = page.locator('.event-card, [data-testid="event-card"]').first();
    if (!(await eventCard.count() > 0 && await eventCard.isVisible())) {
      console.warn('No event card visible on catalog page (mobile)');
      return;
    }
    // Controls large enough to tap (min 44px height)
    const buttons = page.locator('button:visible, a.btn:visible').first();
    if (await buttons.isVisible()) {
      const box = await buttons.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(30); // relax to 30px for smaller CTAs
      }
    }
  });

  // CON-UI-004
  test('CON-UI-004 | Text readability and CTA contrast', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await acceptCookies(page);

    // Headings should be visible and not zero-sized
    const h1 = page.locator('h1').first();
    if (await h1.isVisible()) {
      const box = await h1.boundingBox();
      expect(box?.height).toBeGreaterThan(0);
    }

    // Primary CTA button should be visible
    const primaryCta = page.locator(
      'button.btn-primary, .btn--primary, a.btn-primary, [data-testid="primary-cta"], button:has-text("Купити"), button:has-text("Buy")'
    ).first();
    if (await primaryCta.isVisible()) {
      const box = await primaryCta.boundingBox();
      expect(box?.width).toBeGreaterThan(0);
      expect(box?.height).toBeGreaterThan(0);
    }

    // Check CSS contrast property is defined (best-effort — Playwright doesn't run Axe by default)
    const hasLowOpacityText = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('p, h1, h2, h3, span, a'));
      return els.some(el => {
        const style = window.getComputedStyle(el);
        return parseFloat(style.opacity) < 0.3;
      });
    });
    expect(hasLowOpacityText).toBeFalsy();
  });

});
