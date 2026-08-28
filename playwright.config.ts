import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config for GuiaTV.
 *
 * Target: a scratch-port Angular dev server (CSR, `ng serve --configuration
 * development`) that this config boots itself on PORT (default 4210), plus
 * the backend compiled from the same worktree on isolated port 4310.
 *
 * Data source: the frontend uses same-origin `/v2` requests and its dev proxy
 * forwards them to the isolated backend. Both sides therefore exercise the
 * current checkout instead of whichever release happens to own port 4000.
 * The journeys are read-only; register/login mocks /v2/auth/* via
 * Playwright route interception so no throwaway account is ever written to
 * the real database (see e2e/specs/auth.spec.ts for the rationale).
 */
const PORT = process.env.E2E_PORT || '4210';
const BASE_URL = `http://localhost:${PORT}`;
process.env.E2E_BACKEND_URL ||= 'http://127.0.0.1:4310';

export default defineConfig({
  testDir: './e2e/specs',
  globalSetup: require.resolve('./e2e/global-setup.ts'),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // 1 retry in CI; locally, leave at 0 by default so a run reports true
  // first-attempt reality. This suite hits a real, shared, actively-used
  // backend (not a dedicated test double) — set PWTEST_RETRIES=1 locally if
  // you want a retry to absorb transient latency from other traffic on that
  // same instance.
  retries: process.env.CI ? 1 : Number(process.env.PWTEST_RETRIES || 0),
  // The suite hits a real, shared, actively-used backend. Keep local workers
  // bounded (2) so parallel journeys don't saturate the shared API and flake
  // on pure latency. CI uses 2 as well; override with PWTEST_WORKERS.
  workers: process.env.CI ? 2 : Number(process.env.PWTEST_WORKERS || 2),
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  // Generous timeouts: the suite uses real persisted data whose first-touch
  // response for a given query can take
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
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run build:backend && DISABLE_SCHEDULED_JOBS=true ALLOWED_ORIGINS=http://localhost:4210 PORT=4310 node apps/backend/dist/server/index.js',
      cwd: '.',
      url: 'http://127.0.0.1:4310/health',
      reuseExistingServer: false,
      timeout: 180_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: `GUIATV_PROXY_TARGET=http://127.0.0.1:4310 npx ng serve --configuration development --proxy-config proxy.conf.js --port ${PORT} --host 0.0.0.0`,
      cwd: './apps/frontend',
      url: BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
});
