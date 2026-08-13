import { Page, Locator, expect } from '@playwright/test';

/**
 * Shared helpers for GuiaTV E2E specs.
 */

/** First real program/content card rendered by <app-unified-program-card>. */
export function programCards(page: Page): Locator {
  return page.locator('.program-card');
}

/** Reads and trims the visible title of a program card (real rendered content). */
export async function cardTitle(card: Locator): Promise<string> {
  const text = await card.locator('.program-card__title').first().innerText();
  return text.trim();
}

/**
 * Fails the test if the page is showing the literal string "undefined"/"NaN"
 * or "[object Object]" anywhere in the rendered body — the classic signature
 * of an un-guarded template binding on a failed/empty API response.
 */
export async function assertNoRenderedUndefined(page: Page): Promise<void> {
  const bodyText = await page.locator('body').innerText();
  expect(bodyText).not.toMatch(/\bundefined\b/);
  expect(bodyText).not.toMatch(/\bNaN\b/);
  expect(bodyText).not.toContain('[object Object]');
}

/**
 * Fails the test if a loading/skeleton indicator is still visible after the
 * page has had time to settle — guards against the "infinite spinner" failure
 * mode called out in brief §29.
 */
export async function assertNoStuckSpinner(page: Page): Promise<void> {
  const spinner = page.locator(
    '.animate-spin, app-unified-skeleton-block, .skeleton, [class*="loading"]'
  );
  // Give the app a moment to resolve, then require no spinner to still be visible.
  await page.waitForTimeout(1500);
  const count = await spinner.count();
  for (let i = 0; i < count; i++) {
    await expect(spinner.nth(i)).not.toBeVisible({ timeout: 8000 });
  }
}

/**
 * Body must render something — not a blank/white-screen crash.
 *
 * This is a one-shot innerText() read polled via expect.poll(), not a
 * single check: on the CSR dev-server build this test suite targets, the
 * app can legitimately have zero rendered text for a brief moment after
 * navigation while Angular finishes its first render pass. A single
 * immediate read races that window and fails even though the app renders
 * real content moments later (confirmed via screenshot on a prior false
 * failure here) - polling for up to 10s removes that race without masking
 * a genuine blank-screen bug, since a real crash stays empty the whole window.
 */
export async function assertNotBlankScreen(page: Page): Promise<void> {
  await expect
    .poll(async () => (await page.locator('body').innerText()).trim().length, {
      timeout: 10_000,
    })
    .toBeGreaterThan(20);
}
