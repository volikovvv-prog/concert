import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get emailInput(): Locator {
    return this.page.locator('input[name="email"], input[type="email"], [data-testid="login-email"]');
  }

  get passwordInput(): Locator {
    return this.page.locator('input[name="password"], input[type="password"], [data-testid="login-password"]');
  }

  get loginBtn(): Locator {
    return this.page.locator('button[type="submit"]:has-text("Увійти"), button:has-text("Login"), button:has-text("Sign in"), [data-testid="login-btn"]');
  }

  get forgotPasswordLink(): Locator {
    return this.page.locator('a:has-text("Забули пароль"), a:has-text("Forgot password"), [data-testid="forgot-password"]');
  }

  get loginError(): Locator {
    return this.page.locator('[data-testid="login-error"], .login-error, .auth-error');
  }

  get profileMenu(): Locator {
    return this.page.locator('[data-testid="profile-menu"], .user-menu, .header__user');
  }

  get logoutBtn(): Locator {
    return this.page.locator('button:has-text("Вийти"), a:has-text("Logout"), a:has-text("Вийти"), [data-testid="logout-btn"]');
  }

  async open(): Promise<void> {
    await this.page.goto('/login');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async logout(): Promise<void> {
    await this.profileMenu.click();
    await this.logoutBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async isLoggedIn(): Promise<boolean> {
    return this.profileMenu.isVisible();
  }
}
