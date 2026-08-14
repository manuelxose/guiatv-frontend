import { test, expect } from '@playwright/test';
import { assertNoRenderedUndefined, assertNotBlankScreen, cardTitle } from '../fixtures/helpers';

/**
 * Journey 1 (brief §28.1): Home -> Ahora en TV -> programa -> ficha.
 *
 * Runs against the real backend's read-only TV data (see playwright.config.ts).
 */
test.describe('Home -> Ahora en TV -> programa -> ficha', () => {
  test('opens a live program from the homepage and lands on its real detail page', async ({ page }) => {
    await page.goto('/');
    await assertNotBlankScreen(page);

    const liveSection = page.locator('.home-page__module', {
      has: page.getByText('Ahora en TV', { exact: true }),
    });
    await expect(liveSection).toBeVisible({ timeout: 15_000 });

    const firstCard = liveSection.locator('.program-card').first();
    await expect(firstCard).toBeVisible({ timeout: 15_000 });
    const title = await cardTitle(firstCard);
    expect(title.length).toBeGreaterThan(0);

    await firstCard.locator('a.program-card__tap').click();
    await page.waitForURL(/\/(programas|peliculas|series|detalles)\//, { timeout: 15_000 });

    // Real rendered content on the ficha: an <h1> matching the card's title.
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 15_000 });
    const headingText = (await heading.innerText()).trim();
    expect(headingText.length).toBeGreaterThan(0);
    expect(headingText.localeCompare(title, 'es', { sensitivity: 'base' })).toBe(0);

    await assertNoRenderedUndefined(page);
  });
});
