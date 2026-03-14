import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class CartPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get cartItems(): Locator {
    return this.page.locator('.cart-item, [data-testid="cart-item"]');
  }

  get cartTotal(): Locator {
    return this.page.locator('[data-testid="cart-total"], .cart-total, .order-total');
  }

  get removeItemBtn(): Locator {
    return this.page.locator('[data-testid="remove-item"], .cart-item__remove, button.remove-ticket');
  }

  get quantityInput(): Locator {
    return this.page.locator('input[type="number"][name*="quantity"], [data-testid="quantity-input"]');
  }

  get promoCodeInput(): Locator {
    return this.page.locator('input[name="promo"], input[placeholder*="промокод"], input[placeholder*="promo"], [data-testid="promo-input"]');
  }

  get applyPromoBtn(): Locator {
    return this.page.locator('button:has-text("Застосувати"), button:has-text("Apply"), [data-testid="apply-promo"]');
  }

  get promoErrorMsg(): Locator {
    return this.page.locator('[data-testid="promo-error"], .promo-error, .promo__error');
  }

  get promoSuccessLabel(): Locator {
    return this.page.locator('[data-testid="promo-success"], .promo-applied, .discount-applied');
  }

  get checkoutBtn(): Locator {
    return this.page.locator('button:has-text("Оформити"), button:has-text("Checkout"), [data-testid="checkout-btn"]');
  }

  get emptyCartMessage(): Locator {
    return this.page.locator('[data-testid="empty-cart"], .cart-empty, :has-text("Кошик порожній"), :has-text("Cart is empty")');
  }

  async open(): Promise<void> {
    await this.page.goto('/cart');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async removeFirstItem(): Promise<void> {
    await this.removeItemBtn.first().click();
    await this.page.waitForLoadState('networkidle');
  }

  async applyPromoCode(code: string): Promise<void> {
    await this.promoCodeInput.fill(code);
    await this.applyPromoBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async proceedToCheckout(): Promise<void> {
    await this.checkoutBtn.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async getTotalAmount(): Promise<string> {
    return (await this.cartTotal.textContent()) ?? '';
  }

  async getItemCount(): Promise<number> {
    return this.cartItems.count();
  }
}
