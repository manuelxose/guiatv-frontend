import { test, expect } from '@playwright/test';
import { assertNoRenderedUndefined, assertNotBlankScreen, cardTitle } from '../fixtures/helpers';

/**
 * Journey 2 (brief §28.2): Home -> Esta noche -> filtrar -> abrir contenido.
 */
test.describe('Home -> Esta noche -> filtrar -> abrir contenido', () => {
  test('follows the tonight module into the night guide, filters by channel, opens content', async ({ page }) => {
    await page.goto('/');
    await assertNotBlankScreen(page);

    const tonightSection = page.locator('.home-page__module', {
      has: page.getByText('Esta noche', { exact: true }),
    });

    const hasTonightModule = await tonightSection.isVisible({ timeout: 10_000 }).catch(() => false);
    if (hasTonightModule) {
      await tonightSection.getByRole('link', { name: 'Ver guía nocturna' }).click();
    } else {
      // Tonight rail is data-dependent (empty outside the evening window in
      // real data); fall back to the same destination the link would open.
      await page.goto('/programacion-tv/guia-canales?liveView=night');
    }

    await page.waitForURL(/\/programacion-tv\/guia-canales/, { timeout: 15_000 });
    await expect(page.locator('#tab-panel-live')).toBeVisible({ timeout: 15_000 });

    // Desktop viewport defaults to the EPG grid view; switch to "rails" so
    // the channel-chip filter and program cards are actually visible/clickable.
    const railsToggle = page.getByRole('button', { name: 'Ver rails' });
    if (await railsToggle.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await railsToggle.click();
    }

    // The production-backed fixture can legitimately have no prime-time
    // entries for the current date. Exercise the documented recovery action
    // and continue the same filter/detail journey with live programmes.
    const emptyRecovery = page.getByRole('button', { name: 'Ver emisiones' });
    if (await emptyRecovery.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await emptyRecovery.click();
    }

    // Filtrar: pick a real channel chip (not "Todos").
    const channelChips = page.locator(
      '.live-view__channel-chip:not(:has-text("Todos"))'
    );
    await expect(channelChips.first()).toBeVisible({ timeout: 15_000 });
    const chipLabel = (await channelChips.first().locator('strong').innerText()).trim();
    await channelChips.first().click();

    // Filtering re-renders the active chip and the program list for that channel.
    await expect(
      page.locator('.live-view__channel-chip--active', { hasText: chipLabel })
    ).toBeVisible({ timeout: 15_000 });

    const firstCard = page.locator('.program-card').first();
    await expect(firstCard).toBeVisible({ timeout: 15_000 });
    const title = await cardTitle(firstCard);
    expect(title.length).toBeGreaterThan(0);

    await firstCard.locator('a.program-card__tap').click();
    await page.waitForURL(/\/(programas|peliculas|series|detalles)\//, { timeout: 15_000 });
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });

    await assertNoRenderedUndefined(page);
  });
});
