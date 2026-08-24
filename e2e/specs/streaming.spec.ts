import { test, expect } from '@playwright/test';
import { assertNoRenderedUndefined, assertNotBlankScreen, cardTitle } from '../fixtures/helpers';

/**
 * Journey 4 (brief §28.4): Streaming -> plataforma -> contenido -> disponibilidad.
 */
test.describe('Streaming -> plataforma -> contenido -> disponibilidad', () => {
  test('picks a platform, opens a title, and sees real "Dónde ver" availability', async ({ page }) => {
    await page.goto('/plataformas');
    await assertNotBlankScreen(page);
    await expect(page.locator('#tab-panel-streaming')).toBeVisible({ timeout: 15_000 });

    const platformButtons = page.locator('.streaming-view__platform-button');
    await expect(platformButtons.first()).toBeVisible({ timeout: 15_000 });
    const platformName = (await platformButtons.first().innerText()).trim();
    expect(platformName.length).toBeGreaterThan(0);
    await platformButtons.first().click();

    // Filtering by platform re-renders the grid for that platform.
    await expect(page.locator('.streaming-view__platform-button--active')).toBeVisible({
      timeout: 15_000,
    });

    const cards = page.locator('.program-card');
    await expect(cards.first()).toBeVisible({ timeout: 15_000 });
    const attempts = Math.min(await cards.count(), 4);

    // Open titles until one resolves to a real detail page. A stale catalog
    // entry (legacy slug the API no longer resolves) may render the honest
    // "not available" state — skip it and try the next title.
    let opened = false;
    for (let index = 0; index < attempts; index += 1) {
      const title = await cardTitle(cards.nth(index));
      if (!title.length) continue;
      await cards.nth(index).locator('a.program-card__tap').click();
      await page.waitForURL(/\/(programas|peliculas|series|detalles)\//, { timeout: 20_000 });
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 30_000 });
      const notAvailable = await page
        .getByText('No hemos podido cargar esta ficha')
        .isVisible({ timeout: 5_000 })
        .catch(() => false);
      if (notAvailable) {
        await page.goto('/plataformas');
        await expect(page.locator('.streaming-view__platform-button').first()).toBeVisible({ timeout: 15_000 });
        await page.locator('.streaming-view__platform-button').first().click();
        await expect(page.locator('.streaming-view__platform-button--active')).toBeVisible({
          timeout: 15_000,
        });
        await expect(cards.first()).toBeVisible({ timeout: 15_000 });
        continue;
      }
      opened = true;
      break;
    }
    expect(opened, 'At least one of the first platform titles must open a real detail page').toBeTruthy();

    // disponibilidad: the "Dónde ver" module is real rendered content, not a stub.
    await expect(page.getByText('Dónde ver', { exact: true })).toBeVisible({ timeout: 30_000 });
    await assertNoRenderedUndefined(page);
  });
});
