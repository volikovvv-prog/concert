import { Page, Locator } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Header ────────────────────────────────────────────────────────────────
  get citySelector(): Locator {
    return this.page.locator('[data-testid="city-selector"], .city-selector, .header__city');
  }

  get languageToggleEN(): Locator {
    return this.page.locator('a[href*="/en"], [data-lang="en"], .lang-en');
  }

  get languageToggleUA(): Locator {
    return this.page.locator('a[href*="/ua"], [data-lang="ua"], .lang-ua');
  }

  get searchBar(): Locator {
    return this.page.locator('input[type="search"], input[placeholder*="пошук"], input[placeholder*="Search"], .search-input');
  }

  get mainNav(): Locator {
    return this.page.locator('header nav, .header__nav');
  }

  get faqLink(): Locator {
    return this.page.locator('a[href*="faq"], a[href*="help"], a:has-text("FAQ"), a:has-text("Допомога")');
  }

  get catalogLink(): Locator {
    return this.page.locator('a[href*="/catalog"], a:has-text("Всі категорії"), a:has-text("All categories")');
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  get footer(): Locator {
    return this.page.locator('footer');
  }

  get footerPhoneLink(): Locator {
    return this.footer.locator('a[href^="tel:"]').first();
  }

  get footerEmailLink(): Locator {
    return this.footer.locator('a[href^="mailto:"]').first();
  }

  get footerSocialLinks(): Locator {
    return this.footer.locator('a[href*="facebook"], a[href*="instagram"], a[href*="telegram"]');
  }

  // ── Cookie banner ─────────────────────────────────────────────────────────
  get cookieBanner(): Locator {
    return this.page.locator('.cookie-banner, [data-testid="cookie-consent"], #cookie-banner');
  }

  get acceptCookiesBtn(): Locator {
    return this.page.locator('button:has-text("Прийняти"), button:has-text("Accept"), [data-testid="accept-cookies"]');
  }

  get rejectCookiesBtn(): Locator {
    return this.page.locator('button:has-text("Відхилити"), button:has-text("Reject"), [data-testid="reject-cookies"]');
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  async goto(path: string = '/'): Promise<void> {
    await this.page.goto(path);
  }

  async waitForNetworkIdle(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  async getPageTitle(): Promise<string> {
    return this.page.title();
  }

  async acceptCookiesIfPresent(): Promise<void> {
    try {
      await this.cookieBanner.waitFor({ state: 'visible', timeout: 3000 });
      await this.acceptCookiesBtn.click();
      await this.cookieBanner.waitFor({ state: 'hidden', timeout: 3000 });
    } catch {
      // Banner not shown – continue
    }
  }

  async switchLanguageToEN(): Promise<void> {
    await this.languageToggleEN.click();
    await this.page.waitForLoadState('domcontentloaded');
  }
}
