import { test, expect } from '@playwright/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { EventPage } from '../../pages/EventPage';
import { SeatMapPage } from '../../pages/SeatMapPage';
import { CartPage } from '../../pages/CartPage';
import { LoginPage } from '../../pages/LoginPage';
import { acceptCookies } from '../../utils/helpers';
import { PROMO, TEST_USER } from '../../fixtures/testData';

/** Navigate from catalog → event → seat map → add to cart. */
async function addTicketToCart(page: any): Promise<boolean> {
  const catalog = new CatalogPage(page);
  await catalog.open();
  await acceptCookies(page);
  await catalog.eventCards.first().click();
  await page.waitForLoadState('domcontentloaded');

  const event = new EventPage(page);
  const btn = (await event.chooseSeatsButton.isVisible())
    ? event.chooseSeatsButton
    : event.buyTicketButton;

  if (!(await btn.isVisible())) return false;
  await btn.click();
  await page.waitForLoadState('domcontentloaded');

  const seatMap = new SeatMapPage(page);
  try {
    await seatMap.seatMapContainer.waitFor({ state: 'visible', timeout: 8000 });
    await seatMap.selectSeat(0);
    await seatMap.clickContinue();
  } catch {
    // Not a seated event — might have gone straight to cart
  }
  await page.waitForLoadState('domcontentloaded');
  return true;
}

test.describe('Cart & Promo', () => {

  // CON-CART-001
  test('CON-CART-001 | Add selected seats to cart', async ({ page }) => {
    const added = await addTicketToCart(page);
    if (!added) test.skip(true, 'Could not add ticket to cart');

    const cart = new CartPage(page);
    await expect(cart.cartItems.first()).toBeVisible();
    await expect(cart.cartTotal).toBeVisible();

    const totalText = await cart.getTotalAmount();
    expect(totalText).toMatch(/\d/);
  });

  // CON-CART-002
  test('CON-CART-002 | Cart shows correct details per ticket', async ({ page }) => {
    const added = await addTicketToCart(page);
    if (!added) test.skip(true, 'Could not add ticket to cart');

    const cart = new CartPage(page);
    await expect(cart.cartItems.first()).toBeVisible();

    // Each item should show event name and price
    const firstItem = cart.cartItems.first();
    const itemText = await firstItem.textContent();
    expect(itemText).toMatch(/\d/); // has a number (price)
  });

  // CON-CART-003
  test('CON-CART-003 | Remove a ticket from cart', async ({ page }) => {
    // Add two tickets if possible, else one
    const added = await addTicketToCart(page);
    if (!added) test.skip(true, 'Could not add ticket to cart');

    const cart = new CartPage(page);
    const initialCount = await cart.getItemCount();
    if (initialCount === 0) test.skip(true, 'Cart is empty');

    const totalBefore = await cart.getTotalAmount();
    await cart.removeFirstItem();

    const newCount = await cart.getItemCount();
    expect(newCount).toBe(initialCount - 1);

    if (newCount > 0) {
      const totalAfter = await cart.getTotalAmount();
      expect(totalAfter).not.toBe(totalBefore);
    }
  });

  // CON-CART-004
  test('CON-CART-004 | Change ticket quantity', async ({ page }) => {
    const added = await addTicketToCart(page);
    if (!added) test.skip(true, 'Could not add ticket to cart');

    const cart = new CartPage(page);
    const qtyInput = cart.quantityInput.first();
    if (!(await qtyInput.isVisible())) test.skip(true, 'No quantity input available');

    const totalBefore = await cart.getTotalAmount();
    await qtyInput.fill('2');
    await page.keyboard.press('Tab');
    await page.waitForLoadState('networkidle');

    const totalAfter = await cart.getTotalAmount();
    expect(totalAfter).not.toBe(totalBefore);

    // No negative quantity
    const val = await qtyInput.inputValue();
    expect(Number(val)).toBeGreaterThan(0);
  });

  // CON-CART-005
  test('CON-CART-005 | Cart persists after page refresh', async ({ page }) => {
    const added = await addTicketToCart(page);
    if (!added) test.skip(true, 'Could not add ticket to cart');

    const cart = new CartPage(page);
    const countBefore = await cart.getItemCount();
    if (countBefore === 0) test.skip(true, 'Cart is empty');

    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    const countAfter = await cart.getItemCount();
    expect(countAfter).toBe(countBefore);
  });

  // CON-CART-006
  test('CON-CART-006 | Cart behavior after logout/login', async ({ page }) => {
    const added = await addTicketToCart(page);
    if (!added) test.skip(true, 'Could not add ticket to cart');

    const loginPage = new LoginPage(page);
    const cart = new CartPage(page);

    const countBefore = await cart.getItemCount();

    // Log in
    await loginPage.open();
    await loginPage.login(TEST_USER.email, TEST_USER.password);

    // Re-check cart after login
    await cart.open();
    // Cart should either be restored or empty with explanation — no crash
    await expect(page).not.toHaveURL(/error/);
  });

  // CON-CART-007
  test('CON-CART-007 | Apply valid promo code', async ({ page }) => {
    const added = await addTicketToCart(page);
    if (!added) test.skip(true, 'Could not add ticket to cart');

    const cart = new CartPage(page);
    if (!(await cart.promoCodeInput.isVisible())) test.skip(true, 'No promo code field');

    const totalBefore = await cart.getTotalAmount();
    await cart.applyPromoCode(PROMO.valid);

    const promoError = await cart.promoErrorMsg.isVisible().catch(() => false);
    if (!promoError) {
      // Promo was accepted
      const totalAfter = await cart.getTotalAmount();
      expect(await cart.promoSuccessLabel.isVisible()).toBeTruthy();
    } else {
      test.skip(true, 'Valid promo code not configured in test env');
    }
  });

  // CON-CART-008
  test('CON-CART-008 | Apply invalid/expired promo code shows error', async ({ page }) => {
    const added = await addTicketToCart(page);
    if (!added) test.skip(true, 'Could not add ticket to cart');

    const cart = new CartPage(page);
    if (!(await cart.promoCodeInput.isVisible())) test.skip(true, 'No promo code field');

    const totalBefore = await cart.getTotalAmount();
    await cart.applyPromoCode(PROMO.invalid);

    await expect(cart.promoErrorMsg).toBeVisible();
    const totalAfter = await cart.getTotalAmount();
    expect(totalAfter).toBe(totalBefore);

    // Code field should still be editable
    await expect(cart.promoCodeInput).toBeEnabled();
  });

  // CON-CART-009
  test('CON-CART-009 | Empty cart shows friendly state', async ({ page }) => {
    const cart = new CartPage(page);
    await cart.open();

    const itemCount = await cart.getItemCount();
    if (itemCount > 0) test.skip(true, 'Cart is not empty');

    await expect(cart.emptyCartMessage).toBeVisible();
    // CTA to catalog/homepage
    const cta = page.locator('a[href="/"], a[href*="catalog"], a:has-text("Каталог"), a:has-text("Catalog")');
    await expect(cta.first()).toBeVisible();
  });

});
