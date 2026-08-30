import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockAdminAffiliateBackend } from '../fixtures/admin-affiliate-mock';
import { assertNoRenderedUndefined } from '../fixtures/helpers';
import { reviewArtifactPath } from '../fixtures/review-artifact';

/**
 * Phase 9 — Affiliate / Monetization admin area. Closes the "admin mobile
 * UX" gap left open when this feature was first built: a real Chromium
 * browser drives the real Angular app (SSR-off dev server) through every one
 * of the 7 Monetización tabs at both a desktop and a mobile viewport.
 *
 * Per `admin-affiliate-mock.ts`'s header comment, `/v2/user/profile` and
 * every `/v2/admin/affiliate/*` call are intercepted rather than hitting the
 * real shared backend — this suite never logs into or writes to that shared
 * database, matching the existing auth.spec.ts convention exactly.
 */

const SIDEBAR_ITEMS = ['Merchants', 'Programs', 'Offers', 'Networks', 'Placements', 'Verification', 'Analytics'] as const;

// Each Monetización sidebar button's accessible name is "<label> <description>"
// (label + description text nodes concatenated) — "Programs" alone collides
// with the pre-existing Content group's own "Programs" (Metadata audit) item,
// so every tab is looked up by its unique `[title]` (== item.description)
// instead of by label text.
const TAB_TITLES: Record<(typeof SIDEBAR_ITEMS)[number], string> = {
  Merchants: 'Marcas comerciales y alias',
  Programs: 'Relaciones comerciales por red y mercado',
  Offers: 'Planes, precios y vigencia',
  Networks: 'Redes de afiliación',
  Placements: 'Ubicaciones habilitadas',
  Verification: 'Revisión de datos comerciales',
  Analytics: 'Clicks, impresiones y CTR',
};

async function primeAdminSession(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem('gtv_id_token', 'e2e-mock-admin-token');
  });
}

/**
 * The sidebar `<aside>` is always in the DOM (both mobile and desktop) —
 * on mobile it's just translated off-screen (`x < 0`) until the header's
 * "Open navigation" button is clicked. Checking the *opener's* visibility
 * is not a usable signal (it's rendered, and CSS-visible, at every sidebar
 * state) — the aside's own bounding-box position is what actually tells
 * open from closed, on both viewports uniformly.
 */
async function ensureSidebarOpen(page: Page): Promise<void> {
  const aside = page.locator('aside');
  await aside.waitFor({ state: 'attached' });
  const box = await aside.boundingBox();
  if (box && box.x < 0) {
    await page.getByRole('button', { name: 'Open navigation' }).click();
    // `offsetLeft`/CSS `left` never move (the drawer is `left-0`, only its
    // `transform` changes) — poll the rendered bounding box, which is the
    // only thing that reflects the CSS transition actually completing.
    await expect(async () => {
      const openBox = await aside.boundingBox();
      expect(openBox?.x).toBe(0);
    }).toPass({ timeout: 5000 });
  }
}

async function goToMonetizationTab(page: Page, label: (typeof SIDEBAR_ITEMS)[number]): Promise<void> {
  await ensureSidebarOpen(page);
  await page.locator(`aside button[title="${TAB_TITLES[label]}"]`).click();
  // Selecting an item closes the mobile drawer (300ms transition) — settle
  // before the next call re-reads the aside's bounding box.
  await page.waitForTimeout(350);
}

async function assertNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

/** Critical-only: a `<select>`/input with no accessible name is exactly the class of bug this check exists to catch (see the unlabeled status-filter fix this suite found). */
async function assertNoCriticalA11yViolations(page: Page): Promise<void> {
  const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(accessibility.violations.filter((v) => v.impact === 'critical')).toEqual([]);
}

test.describe('Phase 9 — Affiliate admin (Monetización)', () => {
  test('desktop: all seven tabs render real content with no console errors and no critical accessibility violations', async ({
    page,
    context,
  }, testInfo) => {
    // 7 tab switches + 7 axe scans + 3 full-page screenshots regularly runs
    // close to (and, under sandbox load variance, past) the suite's default
    // 45s budget — this test alone needs more room than the global default.
    test.setTimeout(120_000);
    await primeAdminSession(page);
    await mockAdminAffiliateBackend(context);

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.goto('/admin');

    // Reset the error log after the default Overview tab's own (pre-existing,
    // out-of-scope) initial render — everything from here on is this feature.
    consoleErrors.length = 0;

    await goToMonetizationTab(page, 'Merchants');
    await expect(page.getByRole('heading', { name: 'Afiliación y Monetización' })).toBeVisible();
    await expect(page.getByText('Movistar Plus+').first()).toBeVisible();
    await expect(page.getByText('DAZN').first()).toBeVisible();
    await assertNoRenderedUndefined(page);
    await assertNoCriticalA11yViolations(page);
    await page.screenshot({ path: reviewArtifactPath(testInfo, 'affiliate-admin-merchants-desktop.png'), fullPage: true });

    await goToMonetizationTab(page, 'Programs');
    await expect(page.getByText('Configurado ✓')).toBeVisible();
    await expect(page.getByText('Falta')).toBeVisible();
    await assertNoRenderedUndefined(page);
    await assertNoCriticalA11yViolations(page);

    await goToMonetizationTab(page, 'Offers');
    await expect(page.getByText('Plan Básico')).toBeVisible();
    await expect(page.locator('span').filter({ hasText: 'Expirada' })).toBeVisible();
    await assertNoRenderedUndefined(page);
    await assertNoCriticalA11yViolations(page);
    await page.screenshot({ path: reviewArtifactPath(testInfo, 'affiliate-admin-offers-desktop.png'), fullPage: true });

    await goToMonetizationTab(page, 'Networks');
    await expect(page.getByText('AWIN').first()).toBeVisible();
    await assertNoRenderedUndefined(page);
    await assertNoCriticalA11yViolations(page);

    await goToMonetizationTab(page, 'Placements');
    await expect(page.getByText('home').first()).toBeVisible();
    await assertNoRenderedUndefined(page);
    await assertNoCriticalA11yViolations(page);

    await goToMonetizationTab(page, 'Verification');
    await expect(page.getByText('Requiere revisión').first()).toBeVisible();
    await assertNoRenderedUndefined(page);
    await assertNoCriticalA11yViolations(page);

    await goToMonetizationTab(page, 'Analytics');
    await expect(page.getByText('420')).toBeVisible();
    await expect(page.getByText(/revenue/i)).toBeVisible();
    await assertNoRenderedUndefined(page);
    await assertNoCriticalA11yViolations(page);
    await page.screenshot({ path: reviewArtifactPath(testInfo, 'affiliate-admin-analytics-desktop.png'), fullPage: true });

    expect(consoleErrors, `unexpected console/page errors: ${consoleErrors.join('\n')}`).toEqual([]);
  });

  test('mobile (390x844): all seven tabs render without horizontal overflow and stay usable', async ({ page, context }, testInfo) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await primeAdminSession(page);
    await mockAdminAffiliateBackend(context);

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.goto('/admin');
    consoleErrors.length = 0; // same pre-existing-Overview-tab exclusion as the desktop test

    for (const item of SIDEBAR_ITEMS) {
      await goToMonetizationTab(page, item);
      await assertNoHorizontalOverflow(page);
      await assertNoRenderedUndefined(page);
      await assertNoCriticalA11yViolations(page);
    }

    // Full-page evidence of the two most form-heavy tabs at mobile width —
    // this is the "no broken oversized tables, usable cards" requirement.
    await goToMonetizationTab(page, 'Merchants');
    await expect(page.getByText('Movistar Plus+').first()).toBeVisible();
    await page.screenshot({ path: reviewArtifactPath(testInfo, 'affiliate-admin-merchants-mobile.png'), fullPage: true });

    await goToMonetizationTab(page, 'Offers');
    await expect(page.locator('span').filter({ hasText: 'Expirada' })).toBeVisible();
    await page.screenshot({ path: reviewArtifactPath(testInfo, 'affiliate-admin-offers-mobile.png'), fullPage: true });

    expect(consoleErrors, `unexpected console/page errors: ${consoleErrors.join('\n')}`).toEqual([]);
  });

  test('creating a merchant round-trips through the real form and service into the list', async ({ page, context }) => {
    await primeAdminSession(page);
    await mockAdminAffiliateBackend(context);

    await page.goto('/admin');
    await goToMonetizationTab(page, 'Merchants');

    await page.locator('#merchant-name').fill('Netflix');
    await page.locator('#merchant-key').fill('netflix');
    await page.locator('#merchant-url').fill('https://www.netflix.com');
    await page.getByRole('button', { name: 'Crear merchant' }).click();

    await expect(page.getByText('Merchant creado.')).toBeVisible();
  });
});
