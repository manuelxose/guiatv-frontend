import { defineConfig, devices } from '@playwright/test';

/**
 * Phase 3D: the entity detail page in desktop and mobile browsers. Unlike the main suite this needs no database and
 * no shared backend: the spec starts the real SSR bundle (`npm run build:ssr` first) in front of a fake API that
 * serves the public entity shape, so it checks exactly what a visitor and a crawler receive.
 *   npx playwright test -c playwright.entity.config.ts
 */
export default defineConfig({
  testDir: './e2e/entity',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: { trace: 'on-first-retry', screenshot: 'only-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
});
