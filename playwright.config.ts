import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: 'https://concert.ua',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'uk-UA',
    timezoneId: 'Europe/Kiev',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
//    {
//      name: 'firefox-desktop',
//      use: {
//        ...devices['Desktop Firefox'],
//        viewport: { width: 1920, height: 1080 },
//      },
//    },
//    {
//      name: 'tablet',
//      use: {
//        ...devices['iPad Pro'],
//        viewport: { width: 768, height: 1024 },
//      },
//    },
//    {
//      name: 'mobile-chrome',
//      use: {
//        ...devices['Pixel 5'],
//        viewport: { width: 375, height: 667 },
//      },
//    },
  //
  ],
  outputDir: 'test-results/',
});
