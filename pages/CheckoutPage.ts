import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class CheckoutPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Form fields ───────────────────────────────────────────────────────────
  get nameInput(): Locator {
    return this.page.locator('input[name="name"], input[name="first_name"], [data-testid="name-input"]');
  }

  get emailInput(): Locator {
    return this.page.locator('input[type="email"], input[name="email"], [data-testid="email-input"]');
  }

  get phoneInput(): Locator {
    return this.page.locator('input[type="tel"], input[name="phone"], [data-testid="phone-input"]');
  }

  // ── Delivery options ──────────────────────────────────────────────────────
  get deliveryEmail(): Locator {
    return this.page.locator('input[value="email"], label:has-text("Email"), [data-testid="delivery-email"]');
  }

  get deliverySMS(): Locator {
    return this.page.locator('input[value="sms"], label:has-text("SMS"), [data-testid="delivery-sms"]');
  }

  // ── Order summary ─────────────────────────────────────────────────────────
  get orderSummary(): Locator {
    return this.page.locator('.order-summary, [data-testid="order-summary"]');
  }

  get orderSummaryTotal(): Locator {
    return this.page.locator('[data-testid="summary-total"], .order-summary__total');
  }

  // ── Validation messages ───────────────────────────────────────────────────
  get nameError(): Locator {
    return this.page.locator('[data-testid="name-error"], .field-error[for="name"], input[name="name"] ~ .error');
  }

  get emailError(): Locator {
    return this.page.locator('[data-testid="email-error"], .field-error[for="email"], input[name="email"] ~ .error');
  }

  get phoneError(): Locator {
    return this.page.locator('[data-testid="phone-error"], .field-error[for="phone"], input[name="phone"] ~ .error');
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  get submitBtn(): Locator {
    return this.page.locator('button[type="submit"]:has-text("Оплатити"), button:has-text("Pay"), button:has-text("Continue"), [data-testid="submit-order"]');
  }

  async open(): Promise<void> {
    await this.page.goto('/checkout');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async fillBuyerInfo(name: string, email: string, phone: string): Promise<void> {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.phoneInput.fill(phone);
  }

  async selectEmailDelivery(): Promise<void> {
    await this.deliveryEmail.click();
  }

  async selectSmsDelivery(): Promise<void> {
    await this.deliverySMS.click();
  }

  async submit(): Promise<void> {
    await this.submitBtn.click();
  }

  async getOrderSummaryTotal(): Promise<string> {
    return (await this.orderSummaryTotal.textContent()) ?? '';
  }
}
