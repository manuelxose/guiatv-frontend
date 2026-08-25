import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockAuthBackend } from '../fixtures/auth-mock';

test.describe('GuíaTV assistant', () => {
  test('mobile composer exposes progress, cancellation, retry, and secondary social navigation', async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockAuthBackend(context);
    await page.addInitScript(() => {
      localStorage.setItem('gtv_id_token', 'e2e-mock-access-token');
      localStorage.setItem('gtv_refresh_token', 'e2e-mock-refresh-token');
    });
    await context.route('**/v2/ai/chat/stream', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1_500));
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: [
          'event: ping',
          'data: {"requestId":"e2e-request"}',
          '',
          'event: progress',
          'data: {"phase":"retrieving","label":"Consultando la programación…"}',
          '',
          'event: done',
          'data: {}',
          '',
        ].join('\n'),
      });
    });

    const profileReady = page.waitForResponse((response) => response.url().includes('/v2/user/profile'));
    await page.goto('/');
    await profileReady;
    await expect(page.getByRole('link', { name: 'Abrir mi cuenta' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Partidos de hoy/ })).toBeVisible();
    await page.evaluate(() => new Promise<void>((resolve) => {
      const testability = (window as any).getAllAngularTestabilities?.()[0];
      if (testability) testability.whenStable(resolve);
      else resolve();
    }));
    await page.locator('.app-shell__chat-fab').click();

    const dialog = page.getByRole('dialog', { name: 'Asistente GuíaTV' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Abrir chat con personas' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Personas', exact: true })).toHaveCount(0);

    const input = dialog.getByRole('textbox', { name: 'Mensaje para el asistente' });
    await expect(input).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'En TV ahora' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Fútbol hoy' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Esta noche' })).toBeVisible();

    await expect(page.locator('.app-shell__route-content')).toHaveAttribute('inert', '');
    await expect(page.locator('.app-shell__mobile-nav')).toHaveAttribute('inert', '');
    await expect(page.locator('.app-shell__chat-backdrop')).toHaveAttribute('tabindex', '-1');
    const dialogFocusables = dialog.locator(
      'a[href], textarea:not([disabled]), input:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = dialogFocusables.first();
    const lastFocusable = dialogFocusables.last();
    await firstFocusable.focus();
    await page.keyboard.press('Shift+Tab');
    await expect(lastFocusable).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    const fab = page.locator('.app-shell__chat-fab');
    await expect(fab).toBeFocused();
    await fab.click();
    await expect(dialog).toBeVisible();

    await dialog.getByRole('button', { name: 'Cerrar asistente' }).click();
    const minibar = page.getByRole('button', { name: /Recomendaciones/ });
    await expect(minibar).toBeVisible();
    await expect(minibar).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(dialog.locator(':focus')).toHaveCount(0);
    await minibar.click();
    await expect(dialog).toBeVisible();

    const accessibility = await new AxeBuilder({ page })
      .include('.app-shell__chat-panel--mobile')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(accessibility.violations.filter((violation) => violation.impact === 'critical')).toEqual([]);
    await page.screenshot({ path: '.impeccable/review/assistant-mobile-light.png' });

    await input.fill('¿Qué ponen ahora en La 1?');
    await dialog.getByRole('button', { name: 'Enviar mensaje' }).click();
    await expect(dialog.getByRole('status')).toContainText(/Conectando|Consultando/);
    await expect(dialog.getByRole('button', { name: 'Detener respuesta' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Detener respuesta' }).click();
    await expect(dialog.getByRole('button', { name: 'Reintentar última consulta' })).toBeVisible();

    expect(await dialog.evaluate((element) => element.scrollWidth)).toBeLessThanOrEqual(390);

    await dialog.getByRole('button', { name: 'Abrir chat con personas' }).click();
    await expect(dialog.getByRole('heading', { name: 'Personas' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Volver al asistente' }).click();
    await expect(input).toBeVisible();
  });
});
