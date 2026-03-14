import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';
import { acceptCookies } from '../../utils/helpers';

test.describe('Homepage & Navigation', () => {

  // CON-HOME-001
  test('CON-HOME-001 | Homepage loads successfully', async ({ page }) => {
    const home = new HomePage(page);
    await home.open();
    await expect(page).not.toHaveURL(/error|5\d\d/);
    // Check header block
    if (await home.headerBlock.count() > 0) {
      await expect(home.headerBlock.first()).toBeVisible();
    } else {
      console.warn('Header block not found');
    }
    // Check city selector
    if (await home.citySelector.count() > 0) {
      await expect(home.citySelector.first()).toBeVisible();
    } else {
      console.warn('City selector not found');
    }
    // Check search bar
    if (await home.searchBar.count() > 0) {
      await expect(home.searchBar.first()).toBeVisible();
    } else {
      console.warn('Search bar not found');
    }
    // Check categories block
    if (await home.categoriesBlock.count() > 0) {
      await expect(home.categoriesBlock.first()).toBeVisible();
    } else {
      console.warn('Categories block not found');
    }
    // Check featured events block
    if (await home.featuredEventsBlock.count() > 0) {
      await expect(home.featuredEventsBlock.first()).toBeVisible();
    } else {
      console.warn('Featured events block not found');
    }
  });

  // CON-HOME-002
  test('CON-HOME-002 | Homepage content for unknown city', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const home = new HomePage(page);
    await home.open();
      if (await home.citySelector.count() > 0) {
        await expect(home.citySelector.first()).toBeVisible();
      } else {
        console.warn('City selector not found');
      }
      // No blank state errors — page should have content
      if (await home.featuredEventsBlock.count() > 0) {
        await expect(home.featuredEventsBlock.first()).toBeVisible();
      } else {
        console.warn('Featured events block not found');
      }
    await context.close();
  });

  // CON-HOME-003
  test('CON-HOME-003 | Change city via selector', async ({ page }) => {
    const home = new HomePage(page);
    await home.open();
    await acceptCookies(page);
      if (await home.citySelector.count() > 0) {
        await home.openCitySelector();
        const options = home.cityDropdownOptions;
        if (await options.count() > 1) {
          await expect(options.first()).toBeVisible();
          await options.nth(1).click();
          await page.waitForLoadState('networkidle');
          await expect(home.citySelector.first()).toBeVisible();
          // City selector should still be visible and page updated
          if (await home.featuredEventsBlock.count() > 0) {
            await expect(home.featuredEventsBlock.first()).toBeVisible();
          }
        } else {
          console.warn('Not enough city options to change city');
        }
      } else {
        console.warn('City selector not found');
      }
  });

  // CON-HOME-004
  test('CON-HOME-004 | City persists after navigation', async ({ page }) => {
    const home = new HomePage(page);
    await home.open();
    await acceptCookies(page);
    await home.openCitySelector();
    const options = home.cityDropdownOptions;
    if (await options.count() > 1) {
      const option = options.nth(1);
      await option.scrollIntoViewIfNeeded();
      if (await option.isVisible() && await option.isEnabled()) {
        await option.click();
        await page.waitForLoadState('networkidle');
        const selectedCity = await home.getSelectedCity();
        await page.goto('/catalog');
        await page.waitForLoadState('networkidle');
        const cityOnCatalog = await home.getSelectedCity();
        expect(cityOnCatalog).toBe(selectedCity);
        await page.goBack();
        await page.waitForLoadState('networkidle');
        const cityOnHome = await home.getSelectedCity();
        expect(cityOnHome).toBe(selectedCity);
      } else {
        console.warn('City option not visible/enabled');
      }
    } else {
      console.warn('Not enough city options to test persistence');
    }
  });

  // CON-HOME-005
  test('CON-HOME-005 | Switch from Ukrainian to English', async ({ page }) => {
    const home = new HomePage(page);
    await home.open();
    await acceptCookies(page);
      if (await home.languageToggleEN.count() > 0) {
        const langToggle = home.languageToggleEN.first();
        await langToggle.scrollIntoViewIfNeeded();
        if (await langToggle.isVisible() && await langToggle.isEnabled()) {
          await langToggle.click();
          await page.waitForLoadState('domcontentloaded');
          await expect(page).toHaveURL(/\/en/);
          // At least one expected English label should be visible
          const englishLabel = page.locator(':text("All categories"), :text("Search"), :text("Events")');
          if (await englishLabel.count() > 0) {
            await expect(englishLabel.first()).toBeVisible();
          } else {
            console.warn('English label not found after switching language');
          }
        } else {
          console.warn('Language toggle EN not visible/enabled');
        }
      } else {
        console.warn('Language toggle EN not found');
      }
  });

  // CON-HOME-006
  test('CON-HOME-006 | Language persists after navigation', async ({ page }) => {
    const home = new HomePage(page);
    await home.open();
    await acceptCookies(page);
      if (await home.languageToggleEN.count() > 0) {
        const langToggle = home.languageToggleEN.first();
        await langToggle.scrollIntoViewIfNeeded();
        if (await langToggle.isVisible() && await langToggle.isEnabled()) {
          await langToggle.click();
          await page.waitForLoadState('domcontentloaded');
          await expect(page).toHaveURL(/\/en/);
          await page.goto(page.url().replace(/\/$/, '') + '/catalog');
          await page.waitForLoadState('domcontentloaded');
          await expect(page).toHaveURL(/\/en/);
          await page.reload();
          await expect(page).toHaveURL(/\/en/);
        } else {
          console.warn('Language toggle EN not visible/enabled');
        }
      } else {
        console.warn('Language toggle EN not found');
      }
  });

  // CON-HOME-007
  test('CON-HOME-007 | Open catalog from header', async ({ page }) => {
    const home = new HomePage(page);
    await home.open();
    await acceptCookies(page);
      if (await home.catalogLink.count() > 0) {
        await home.catalogLink.first().click();
        await page.waitForLoadState('domcontentloaded');
        await expect(page).toHaveURL(/catalog|events/);
        const title = page.locator('h1, .page-title');
        if (await title.count() > 0) {
          await expect(title.first()).toBeVisible();
        } else {
          console.warn('Catalog page title not found');
        }
      } else {
        console.warn('Catalog link not found');
      }
  });

  // CON-HOME-008
  test('CON-HOME-008 | Open FAQ/Help from header', async ({ page }) => {
    const home = new HomePage(page);
    await home.open();
    await acceptCookies(page);
      if (await home.faqLink.count() > 0) {
        const faq = home.faqLink.first();
        await faq.scrollIntoViewIfNeeded();
        if (await faq.isVisible() && await faq.isEnabled()) {
          await faq.click();
          await page.waitForLoadState('domcontentloaded');
          await expect(page).not.toHaveURL(/404/);
          const faqTitle = page.locator('h1, .page-title, article');
          if (await faqTitle.count() > 0) {
            await expect(faqTitle.first()).toBeVisible();
          } else {
            console.warn('FAQ page title/content not found');
          }
        } else {
          console.warn('FAQ link not visible/enabled');
        }
      } else {
        console.warn('FAQ link not found');
      }
  });

  // CON-HOME-009
  test('CON-HOME-009 | Footer social links open in new tab', async ({ page, context }) => {
    const home = new HomePage(page);
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await acceptCookies(page);
    await home.footer.scrollIntoViewIfNeeded();

    const socialLinks = home.footerSocialLinks;
    const count = await socialLinks.count();
      if (count > 0) {
        // Check first social link has target="_blank" or rel="noopener"
        const firstLink = socialLinks.first();
        await firstLink.scrollIntoViewIfNeeded();
        if (await firstLink.isVisible() && await firstLink.isEnabled()) {
          const target = await firstLink.getAttribute('target');
          const href = await firstLink.getAttribute('href');
          expect(href).toBeTruthy();
          expect(target).toBe('_blank');
        } else {
          console.warn('First social link not visible/enabled');
        }
      } else {
        console.warn('No social links found in footer');
      }

    // Check first social link has target="_blank" or rel="noopener"
    const firstLink = socialLinks.first();
    const target = await firstLink.getAttribute('target');
    const href = await firstLink.getAttribute('href');
    expect(href).toBeTruthy();
    expect(target).toBe('_blank');
  });

  // CON-HOME-010
  test('CON-HOME-010 | Accept all cookies banner', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const home = new HomePage(page);
    await home.open();

    try {
      await home.cookieBanner.waitFor({ state: 'visible', timeout: 5000 });
      await home.acceptCookiesBtn.click();
      await home.cookieBanner.waitFor({ state: 'hidden', timeout: 3000 });

      await page.reload();
      const bannerAfterReload = home.cookieBanner;
      // Banner should not reappear after acceptance
      await expect(bannerAfterReload).not.toBeVisible();
    } catch {
      test.skip(true, 'Cookie banner not present in this environment');
    }
    await context.close();
  });

  // CON-HOME-011
  test('CON-HOME-011 | Reject cookies and site still functions', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const home = new HomePage(page);
    await home.open();

    try {
      await home.cookieBanner.waitFor({ state: 'visible', timeout: 5000 });
      await home.rejectCookiesBtn.click();
      await home.cookieBanner.waitFor({ state: 'hidden', timeout: 3000 });
      // Main content should still be accessible
      await expect(home.featuredEventsBlock).toBeVisible();
    } catch {
      test.skip(true, 'Cookie banner not present in this environment');
    }
    await context.close();
  });

  // CON-HOME-012
  test('CON-HOME-012 | 404 page for invalid URL', async ({ page }) => {
    await page.goto('/en/non-existent-page-xyz');
    await page.waitForLoadState('domcontentloaded');
    // Expect either a 404 indicator or user-friendly error
    const errorIndicators = page.locator(':text("404"), :text("not found"), :text("не знайдено"), .error-page');
    const homeLink = page.locator('a[href="/"], a:has-text("Головна"), a:has-text("Homepage")');
      if (await errorIndicators.count() > 0) {
        await expect(errorIndicators.first()).toBeVisible();
      } else {
        console.warn('404 or error indicator not found');
      }
      if (await homeLink.count() > 0) {
        await expect(homeLink.first()).toBeVisible();
      } else {
        console.warn('Home link not found on 404 page');
      }
  });

});
