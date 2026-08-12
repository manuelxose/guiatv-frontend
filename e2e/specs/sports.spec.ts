import { test, expect } from '@playwright/test';
import { assertNoRenderedUndefined, assertNotBlankScreen, cardTitle } from '../fixtures/helpers';

/**
 * Journey 5 (brief §28.5): Deportes -> evento -> canal/plataforma.
 */
test.describe('Deportes -> evento -> canal/plataforma', () => {
  test('opens a sports event and sees its real channel/platform detail', async ({ page }) => {
    await page.goto('/deportes');
    await assertNotBlankScreen(page);
    await expect(page.locator('#tab-panel-sports')).toBeVisible({ timeout: 15_000 });

    const eventCard = page.locator('.program-card').first();
    await expect(eventCard).toBeVisible({ timeout: 15_000 });
    const title = await cardTitle(eventCard);
    expect(title.length).toBeGreaterThan(0);
    await eventCard.locator('a.program-card__tap').click();

    await page.waitForURL(/\/(programas|peliculas|series|detalles)\//, { timeout: 15_000 });
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 15_000 });
    expect((await heading.innerText()).trim().length).toBeGreaterThan(0);

    // canal/plataforma: the "Dónde ver" availability module is real,
    // API-backed content rendered for every event/content detail page.
    await expect(page.getByText('Dónde ver', { exact: true })).toBeVisible({ timeout: 15_000 });
    await assertNoRenderedUndefined(page);
  });
});
