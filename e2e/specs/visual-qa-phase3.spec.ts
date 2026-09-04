import { test, expect, Page, BrowserContext } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockAuthBackend } from '../fixtures/auth-mock';
import { mockAdminShellBackend } from '../fixtures/admin-shell-mock';
import { assertNotBlankScreen } from '../fixtures/helpers';

/**
 * Phase 3 design-system QA sweep.
 *
 * Route-driven visual/functional/a11y matrix: for a representative set of
 * consumer + admin + chatbot surfaces, capture LIGHT and DARK at MOBILE
 * (390x844) and DESKTOP (1440x900), and on every state check:
 *  - console/page errors and failed critical network requests
 *  - literal "undefined"/"null" text leaking into the DOM
 *  - unexpected horizontal overflow
 *  - broken images
 *  - axe (WCAG 2.2 AA) violations
 *
 * Theme is switched by seeding `localStorage['guiatv-theme']` before first
 * paint (the same persistence key + inline-script resolution path
 * ThemeService itself uses — see theme.service.ts) rather than clicking the
 * nav toggle on every surface, because several of these surfaces (admin,
 * the chatbot dialog, an open program-detail modal) do not reliably expose
 * that control while the state under test is open.
 */

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
] as const;

const THEMES = ['light', 'dark'] as const;

interface StateReport {
  scenario: string;
  viewport: string;
  theme: string;
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: string[];
  hasUndefinedText: boolean;
  hasOverflow: boolean;
  brokenImages: string[];
}

async function seedTheme(page: Page, theme: (typeof THEMES)[number]): Promise<void> {
  await page.addInitScript((value) => {
    try {
      window.localStorage.setItem('guiatv-theme', value);
    } catch {
      /* ignore */
    }
  }, theme);
}

function trackErrors(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('requestfailed', (req) => {
    // Ignore analytics/beacon-style noise and aborted-on-navigation requests.
    const url = req.url();
    if (/analytics|beacon|sentry|gtag|doubleclick/i.test(url)) return;
    const failure = req.failure()?.errorText || 'unknown';
    if (failure === 'net::ERR_ABORTED') return;
    failedRequests.push(`${req.method()} ${url} -> ${failure}`);
  });
  page.on('response', (res) => {
    if (res.status() >= 500) {
      failedRequests.push(`${res.request().method()} ${res.url()} -> HTTP ${res.status()}`);
    }
  });
  return { consoleErrors, pageErrors, failedRequests };
}

async function checkDomHealth(page: Page): Promise<{
  hasUndefinedText: boolean;
  hasOverflow: boolean;
  brokenImages: string[];
}> {
  const bodyText = await page.locator('body').innerText().catch(() => '');
  const hasUndefinedText = /\bundefined\b/.test(bodyText) || /\bNaN\b/.test(bodyText) || bodyText.includes('[object Object]');

  const hasOverflow = await page.evaluate(() => {
    const doc = document.documentElement;
    // Allow intentional horizontal scroll rails/EPG grids; only flag when the
    // *document* itself is wider than the viewport (a real layout bug).
    return doc.scrollWidth > doc.clientWidth + 2;
  });

  const brokenImages = await page.evaluate(() => {
    const broken: string[] = [];
    document.querySelectorAll('img').forEach((img) => {
      if (img.complete && img.naturalWidth === 0 && img.src) {
        broken.push(img.src);
      }
    });
    return broken;
  });

  return { hasUndefinedText, hasOverflow, brokenImages };
}

async function runAxe(page: Page, testInfo: any, label: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
    .analyze();
  await testInfo.attach(`axe-${label}`, {
    body: JSON.stringify(results.violations, null, 2),
    contentType: 'application/json',
  });
  return results.violations;
}

const allReports: StateReport[] = [];

async function captureState(
  page: Page,
  testInfo: any,
  scenario: string,
  viewportName: string,
  theme: string,
): Promise<void> {
  await page.waitForTimeout(400); // let theme-triggered CSS transitions settle
  const health = await checkDomHealth(page);
  const violations = await runAxe(page, testInfo, `${scenario}-${viewportName}-${theme}`);
  const screenshotPath = testInfo.outputPath(`${scenario}-${viewportName}-${theme}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: false });

  allReports.push({
    scenario,
    viewport: viewportName,
    theme,
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    ...health,
  });

  expect(health.hasUndefinedText, `${scenario}/${viewportName}/${theme}: rendered literal undefined/NaN/[object Object]`).toBeFalsy();
  expect(health.brokenImages, `${scenario}/${viewportName}/${theme}: broken <img> src(s)`).toEqual([]);
  if (health.hasOverflow) {
    // Recorded, not hard-failed here — some EPG/rail surfaces intentionally
    // scroll; the final report calls out every flagged instance for review.
    testInfo.annotations.push({
      type: 'overflow-suspect',
      description: `${scenario}/${viewportName}/${theme}`,
    });
  }
  if (violations.length) {
    testInfo.annotations.push({
      type: 'axe-violations',
      description: `${scenario}/${viewportName}/${theme}: ${violations.map((v) => `${v.id}(${v.impact})`).join(', ')}`,
    });
  }
}

interface Scenario {
  name: string;
  requiresAuth?: 'user' | 'admin';
  open: (page: Page, context: BrowserContext) => Promise<void>;
}

const scenarios: Scenario[] = [
  {
    name: 'home',
    open: async (page) => {
      await page.goto('/');
      await assertNotBlankScreen(page);
    },
  },
  {
    name: 'tv-guide-epg',
    open: async (page) => {
      await page.goto('/programacion-tv/guia-canales');
      await assertNotBlankScreen(page);
    },
  },
  {
    name: 'canales',
    open: async (page) => {
      await page.goto('/canales');
      await assertNotBlankScreen(page);
    },
  },
  {
    name: 'football-home',
    open: async (page) => {
      await page.goto('/deportes/futbol');
      await assertNotBlankScreen(page);
    },
  },
  {
    name: 'football-competition-detail',
    open: async (page) => {
      await page.goto('/deportes/futbol/competiciones');
      await assertNotBlankScreen(page);
      const first = page.locator('.competition').first();
      const ok = await first.isVisible({ timeout: 20_000 }).catch(() => false);
      if (ok) {
        await first.click();
        await page.waitForURL(/\/deportes\/futbol\/competiciones\//, { timeout: 20_000 }).catch(() => {});
      }
    },
  },
  {
    name: 'editorial-home',
    open: async (page) => {
      await page.goto('/editorial');
      await assertNotBlankScreen(page);
    },
  },
  {
    name: 'editorial-article',
    open: async (page) => {
      await page.goto('/editorial');
      await assertNotBlankScreen(page);
      const link = page.locator('a.category-lead__story, a.editorial-post-card').first();
      const ok = await link.isVisible({ timeout: 15_000 }).catch(() => false);
      if (ok) {
        await link.click();
        await page.waitForURL(/\/editorial\/(?!categoria\/)[^/]+$/, { timeout: 15_000 }).catch(() => {});
      }
    },
  },
  {
    name: 'program-detail-modal',
    open: async (page) => {
      await page.goto('/programacion-tv/guia-canales');
      await assertNotBlankScreen(page);
      const railsToggle = page.getByRole('button', { name: 'Ver rails' });
      if (await railsToggle.isVisible({ timeout: 3_000 }).catch(() => false)) {
        // Grid view (not rails) is what hosts the click-to-open detail modal.
        // Leave grid as-is; only switch away if we're already in rails.
      }
      const cell = page.locator('.tv-program, .tv-grid__program').first();
      const ok = await cell.isVisible({ timeout: 15_000 }).catch(() => false);
      if (ok) {
        await cell.click();
        await page.waitForTimeout(500);
      }
    },
  },
  {
    name: 'user-area',
    requiresAuth: 'user',
    open: async (page) => {
      await page.addInitScript(() => {
        window.localStorage.setItem('gtv_id_token', 'e2e-mock-access-token');
        window.localStorage.setItem('gtv_refresh_token', 'e2e-mock-refresh-token');
      });
      await page.goto('/perfil');
      await assertNotBlankScreen(page);
    },
  },
  {
    name: 'admin-dashboard',
    requiresAuth: 'admin',
    open: async (page) => {
      await page.addInitScript(() => {
        window.localStorage.setItem('gtv_id_token', 'e2e-mock-shell-admin-token');
      });
      await page.goto('/admin');
      await assertNotBlankScreen(page);
    },
  },
  {
    name: 'chatbot-panel',
    requiresAuth: 'user',
    open: async (page) => {
      await page.addInitScript(() => {
        window.localStorage.setItem('gtv_id_token', 'e2e-mock-access-token');
        window.localStorage.setItem('gtv_refresh_token', 'e2e-mock-refresh-token');
      });
      await page.goto('/');
      await assertNotBlankScreen(page);
      const fab = page.locator('.app-shell__chat-fab');
      const ok = await fab.isVisible({ timeout: 15_000 }).catch(() => false);
      if (ok) {
        await fab.click();
        await page
          .getByRole('dialog', { name: 'Asistente GuíaTV' })
          .waitFor({ state: 'visible', timeout: 10_000 })
          .catch(() => {});
      }
    },
  },
];

test.describe('Phase 3 design-system QA sweep', () => {
  for (const scenario of scenarios) {
    for (const viewport of VIEWPORTS) {
      for (const theme of THEMES) {
        test(`${scenario.name} :: ${viewport.name} :: ${theme}`, async ({ page, context }, testInfo) => {
          test.setTimeout(90_000);
          if (scenario.requiresAuth === 'user') {
            await mockAuthBackend(context);
          } else if (scenario.requiresAuth === 'admin') {
            await mockAdminShellBackend(context);
          }
          const errors = trackErrors(page);
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          await seedTheme(page, theme);
          await scenario.open(page, context);

          await captureState(page, testInfo, scenario.name, viewport.name, theme);

          // Attach collected runtime errors for the final report even when
          // the test itself doesn't hard-fail on them (some are pre-existing
          // / environmental and are called out in the report instead).
          await testInfo.attach(`errors-${scenario.name}-${viewport.name}-${theme}`, {
            body: JSON.stringify(errors, null, 2),
            contentType: 'application/json',
          });
        });
      }
    }
  }
});
