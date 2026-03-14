import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class RegisterPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get nameInput(): Locator {
    return this.page.locator('input[name="name"], input[name="first_name"], [data-testid="register-name"]');
  }

  get emailInput(): Locator {
    return this.page.locator('input[name="email"], input[type="email"], [data-testid="register-email"]');
  }

  get passwordInput(): Locator {
    return this.page.locator('input[name="password"], [data-testid="register-password"]');
  }

  get confirmPasswordInput(): Locator {
    return this.page.locator('input[name="password_confirmation"], [data-testid="register-confirm-password"]');
  }

  get termsCheckbox(): Locator {
    return this.page.locator('input[type="checkbox"][name*="terms"], [data-testid="terms-checkbox"]');
  }

  get submitBtn(): Locator {
    return this.page.locator('button[type="submit"]:has-text("Зареєструватися"), button:has-text("Register"), [data-testid="register-btn"]');
  }

  get nameError(): Locator {
    return this.page.locator('[data-testid="register-name-error"], .field-error[for="name"]');
  }

  get emailError(): Locator {
    return this.page.locator('[data-testid="register-email-error"], .field-error[for="email"]');
  }

  get passwordError(): Locator {
    return this.page.locator('[data-testid="register-password-error"], .field-error[for="password"]');
  }

  get formErrors(): Locator {
    return this.page.locator('.form-error, .field-error, [data-testid*="error"]');
  }

  async open(): Promise<void> {
    await this.page.goto('/register');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async fillForm(name: string, email: string, password: string): Promise<void> {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    if (await this.confirmPasswordInput.isVisible()) {
      await this.confirmPasswordInput.fill(password);
    }
  }

  async acceptTerms(): Promise<void> {
    if (await this.termsCheckbox.isVisible()) {
      await this.termsCheckbox.check();
    }
  }

  async submit(): Promise<void> {
    await this.submitBtn.click();
    await this.page.waitForLoadState('networkidle');
  }
}
