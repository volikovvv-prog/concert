# concert.ua — Playwright TypeScript Test Suite

Automated functional tests for [concert.ua](https://concert.ua), based on the full functional test case specification.

---

## 📁 Project Structure

```
concert-ua-tests/
├── playwright.config.ts          # Playwright configuration (browsers, viewports, reporter)
├── package.json
├── tsconfig.json
├── fixtures/
│   └── testData.ts               # Test data: users, cards, promo codes, viewports
├── pages/                        # Page Object Models
│   ├── BasePage.ts
│   ├── HomePage.ts
│   ├── CatalogPage.ts
│   ├── EventPage.ts
│   ├── SeatMapPage.ts
│   ├── CartPage.ts
│   ├── CheckoutPage.ts
│   ├── LoginPage.ts
│   └── RegisterPage.ts
├── utils/
│   └── helpers.ts                # Shared utilities
└── tests/
    ├── homepage/                 # CON-HOME-001 … CON-HOME-012
    ├── search/                   # CON-SRCH-001 … CON-SRCH-012
    ├── events/                   # CON-EVENT-001 … CON-EVENT-005
    ├── seating/                  # CON-SEAT-001 … CON-SEAT-008
    ├── cart/                     # CON-CART-001 … CON-CART-009
    ├── checkout/                 # CON-CHK-001  … CON-CHK-009
    ├── payments/                 # CON-PAY-001  … CON-PAY-009
    ├── delivery/                 # CON-DEL-001  … CON-DEL-007
    ├── auth/                     # CON-AUTH-001 … CON-AUTH-007
    ├── security/                 # CON-SEC-001  … CON-SEC-005
    ├── ui/                       # CON-UI-001   … CON-UI-004
    ├── errors/                   # CON-ERR-001  … CON-ERR-004
    └── performance/              # CON-PERF-001 … CON-PERF-002
```

---

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **npm** (bundled with Node)

### 2. Install dependencies

```bash
cd concert-ua-tests
npm install
npx playwright install --with-deps
```

### 3. Run all tests

```bash
npm test
```

### 4. Run a specific module

```bash
npm run test:homepage
npm run test:search
npm run test:auth
# ... etc.
```

### 5. Run with visible browser

```bash
npm run test:headed
```

### 6. Interactive UI mode

```bash
npm run test:ui
```

### 7. Open HTML report after run

```bash
npm run test:report
```

---

## ⚙️ Environment Variables

| Variable              | Default                       | Description                                    |
|-----------------------|-------------------------------|------------------------------------------------|
| `TEST_USER_EMAIL`     | `testuser@example.com`        | Existing test account email                    |
| `TEST_USER_PASSWORD`  | `TestPass123!`                | Test account password                          |
| `TEST_ENV`            | _(unset)_                     | Set to `true` to enable payment tests          |
| `VALID_PROMO_CODE`    | `TESTDISCOUNT10`              | A working promo code in the test environment   |

Create a `.env` file or pass variables on the command line:

```bash
TEST_USER_EMAIL=myemail@test.com \
TEST_USER_PASSWORD=MyPass! \
TEST_ENV=true \
npm test
```

---

## 🔬 Test Categories & Counts

| Module               | Test Cases | Notes                                         |
|----------------------|-----------|-----------------------------------------------|
| Homepage & Navigation | 12        | Fully automated                               |
| Search & Filters      | 12        | Fully automated                               |
| Event Details         | 5         | Fully automated                               |
| Seating & Tickets     | 8         | Requires at least one event with seat map     |
| Cart & Promo          | 9         | Promo tests need valid code in env            |
| Checkout              | 9         | Fully automated (needs item in cart)          |
| Payments              | 9         | **Require `TEST_ENV=true`** + sandbox gateway |
| Ticket Delivery       | 7         | Partially require `TEST_ENV=true`             |
| Auth & Profile        | 7         | Fully automated                               |
| Security & Privacy    | 5         | Fully automated                               |
| UI & Responsiveness   | 4         | Multi-viewport                                |
| Error Handling        | 4         | Fully automated                               |
| Performance           | 2         | Fully automated                               |
| **Total**             | **93**    |                                               |

---

## 🌐 Browsers Configured

| Project name      | Browser       | Viewport       |
|-------------------|---------------|----------------|
| `chromium-desktop`| Chromium      | 1920 × 1080    |
| `firefox-desktop` | Firefox       | 1920 × 1080    |
| `tablet`          | iPad Pro      | 768 × 1024     |
| `mobile-chrome`   | Pixel 5       | 375 × 667      |

Run a single browser:

```bash
npx playwright test --project=chromium-desktop
npx playwright test --project=mobile-chrome
```

---

## 💡 Notes

- **Payment tests** (`CON-PAY-*`) are skipped unless `TEST_ENV=true` is set. They require a sandbox payment gateway and test card support.
- **Selector strategy**: All page objects use resilient selectors with `data-testid` as primary, with semantic and class-based fallbacks. Adjust selectors in `pages/` files to match the actual DOM when the site is live.
- **Delivery tests** that require inbox verification (CON-DEL-001, CON-DEL-002) can be extended with a mail-testing service such as [Mailosaur](https://mailosaur.com) or [Mailtrap](https://mailtrap.io).
