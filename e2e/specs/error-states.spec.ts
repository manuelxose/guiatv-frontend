import { test, expect } from '@playwright/test';
import {
  assertNoRenderedUndefined,
  assertNoStuckSpinner,
  assertNotBlankScreen,
} from '../fixtures/helpers';

/**
 * Error-state simulations (brief §29): API unavailable, empty response, 404,
 * broken image. All backend calls are mocked/intercepted here — none of
 * this depends on the real backend actually being down.
 */
test.describe('Error states degrade gracefully', () => {
  test('API unavailable: home renders a real shell/error state, not a blank page or stuck spinner', async ({
    page,
    context,
  }) => {
    await context.route('**/v2/**', (route) => route.abort('failed'));

    await page.goto('/');
    await assertNotBlankScreen(page);
    await assertNoStuckSpinner(page);
    await assertNoRenderedUndefined(page);

    // The shell chrome (top nav / brand) is static markup, not API-gated —
    // it must still render even when every API call fails. The brand renders
    // twice (full + short responsive variants), so target the link role.
    await expect(page.getByRole('link', { name: 'Guía TV — Inicio' })).toBeVisible({ timeout: 15_000 });
  });

  test('empty response: home renders without crashing when APIs return no items', async ({
    page,
    context,
  }) => {
    await context.route('**/v2/**', (route) => {
      const url = route.request().url();
      if (url.includes('/discovery/home')) {
        return route.fulfill({ json: { success: true, data: { personalized: [], platformItems: [] } } });
      }
      if (url.includes('/tv/read')) {
        return route.fulfill({ json: { success: true, data: { items: [] } } });
      }
      if (url.includes('/catalog/platforms')) {
        return route.fulfill({ json: { success: true, data: { items: [] } } });
      }
      if (url.includes('/blog')) {
        return route.fulfill({ json: [] });
      }
      return route.continue();
    });

    await page.goto('/');
    await assertNotBlankScreen(page);
    await assertNoStuckSpinner(page);
    await assertNoRenderedUndefined(page);
    await expect(page.getByRole('link', { name: 'Guía TV — Inicio' })).toBeVisible({ timeout: 15_000 });
  });

  test('404: an unknown route renders the real not-found page, not a blank screen', async ({ page }) => {
    await page.goto('/esta-ruta-no-existe-e2e-test');
    await assertNotBlankScreen(page);
    await assertNoRenderedUndefined(page);
    await expect(page.getByRole('heading', { name: 'Página no encontrada' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText('404', { exact: true })).toBeVisible();
  });

  test('404: an unknown content slug renders the real "not available" state, not a blank screen', async ({
    page,
  }) => {
    await page.goto('/programas/este-programa-no-existe-e2e-test-xyz');
    await assertNotBlankScreen(page);
    await assertNoStuckSpinner(page);
    await assertNoRenderedUndefined(page);
    await expect(
      page.getByRole('heading', { name: 'No hemos podido cargar esta ficha' })
    ).toBeVisible({ timeout: 15_000 });
  });

  test('broken images: program titles still render as real text even when every image 404s', async ({
    page,
    context,
  }) => {
    await context.route(/\.(png|jpg|jpeg|webp|gif|svg)(\?.*)?$/i, (route) => route.fulfill({ status: 404, body: '' }));

    await page.goto('/');
    await assertNotBlankScreen(page);
    await assertNoRenderedUndefined(page);

    const firstCardTitle = page.locator('.program-card__title').first();
    await expect(firstCardTitle).toBeVisible({ timeout: 15_000 });
    expect((await firstCardTitle.innerText()).trim().length).toBeGreaterThan(0);
  });
});
