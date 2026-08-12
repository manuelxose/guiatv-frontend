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

    const contentCard = page.locator('.program-card').first();
    await expect(contentCard).toBeVisible({ timeout: 15_000 });
    const title = await cardTitle(contentCard);
    expect(title.length).toBeGreaterThan(0);
    await contentCard.locator('a.program-card__tap').click();

    await page.waitForURL(/\/(programas|peliculas|series|detalles)\//, { timeout: 15_000 });
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });

    // disponibilidad: the "Dónde ver" module is real rendered content, not a stub.
    await expect(page.getByText('Dónde ver', { exact: true })).toBeVisible({ timeout: 15_000 });
    await assertNoRenderedUndefined(page);
  });
});
