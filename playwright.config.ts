import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config for GuiaTV.
 *
 * Target: a scratch-port Angular dev server (CSR, `ng serve --configuration
 * development`) that this config boots itself on PORT (default 4210 — chosen
 * to avoid the already-running live dev instances on 3000/4200/4000).
 *
 * Data source: apps/frontend's `environment.ts` (dev build) points
 * API_BASE_URL at the already-running real backend on http://localhost:4000.
 * That backend is healthy and only ever receives GET requests from the
 * browsing journeys below — safe, read-only, real data. The register/login
 * journey never talks to that shared backend; it mocks /v2/auth/* via
 * Playwright route interception so no throwaway account is ever written to
 * the real database (see e2e/specs/auth.spec.ts for the rationale).
 *
 * CORS note: the real backend's `ALLOWED_ORIGINS` allowlist only covers the
 * pre-existing dev origins (3000/4200), not this scratch port — confirmed by
 * reproducing it directly (browser console: "blocked by CORS policy... no
 * Access-Control-Allow-Origin header"), which was silently starving every
 * data-dependent journey (stuck skeletons, empty results) despite the
 * backend itself responding fine to curl. Rather than touch the shared
 * backend's env config or the app's `environment.ts` (used by the real
 * dev workflows on 3000/4200 too), Chromium is launched with web security
 * disabled below — the standard, self-contained fix for cross-origin local
 * E2E targets that doesn't touch app or server config.
 */
const PORT = process.env.E2E_PORT || '4210';
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e/specs',
  globalSetup: require.resolve('./e2e/global-setup.ts'),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  // Generous timeouts: this suite hits a real, shared backend (see the CORS
  // note above) whose first-touch response for a given query can take
  // several seconds even after global-setup's cache warm-up, and the home
  // page's combineLatest() waits on ~6 parallel calls to resolve together.
  timeout: 45_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--disable-web-security', '--disable-site-isolation-trials'],
        },
      },
    },
  ],
  webServer: {
    command: `npx ng serve --configuration development --port ${PORT} --host 0.0.0.0`,
    cwd: './apps/frontend',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
