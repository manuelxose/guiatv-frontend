import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockAuthBackend } from '../fixtures/auth-mock';
import { reviewArtifactPath } from '../fixtures/review-artifact';

test.describe('GuíaTV assistant', () => {
  test('mobile composer exposes progress, cancellation, retry, and secondary social navigation', async ({
    page,
    context,
    }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockAuthBackend(context);
    await page.addInitScript(() => {
      localStorage.setItem('gtv_id_token', 'e2e-mock-access-token');
      localStorage.setItem('gtv_refresh_token', 'e2e-mock-refresh-token');
    });
    let streamRequestCount = 0;
    await context.route('**/v2/ai/chat/stream', async (route) => {
      streamRequestCount += 1;
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
    await expect(dialog.getByRole('button', { name: 'Conversaciones' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Completar Perfil IA' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Nueva conversación' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Minimizar asistente' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Cerrar asistente' })).toHaveCount(0);
    await expect(dialog.getByRole('button', { name: 'Personas', exact: true })).toHaveCount(0);

    await dialog.getByRole('button', { name: 'Conversaciones' }).click();
    await expect(dialog.getByRole('heading', { name: 'Conversaciones' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Acciones de Series para el fin de semana' }).click();
    await expect(dialog.getByRole('button', { name: 'Renombrar' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Eliminar…' }).click();
    await expect(dialog.getByText('¿Eliminar esta conversación?')).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    await dialog.getByRole('button', { name: 'Cerrar conversaciones' }).click();

    await dialog.getByRole('button', { name: 'Completar Perfil IA' }).click();
    await expect(dialog.getByRole('heading', { name: 'Perfil IA' })).toBeVisible();
    await page.screenshot({ path: reviewArtifactPath(testInfo, 'assistant-profile-mobile-light.png') });
    await dialog.getByRole('button', { name: 'Netflix' }).click();
    await dialog.getByRole('button', { name: 'Guardar y continuar' }).click();
    await expect(dialog.getByRole('heading', { name: '¿Qué géneros te interesan?' })).toBeVisible();
    expect(streamRequestCount).toBe(0);
    await dialog.getByRole('button', { name: 'Volver al chat' }).click();

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
    const minibar = page.getByRole('button', { name: /Recomendaciones/ });
    await expect(minibar).toBeVisible();
    await expect(minibar).toBeFocused();
    await minibar.click();
    await expect(dialog).toBeVisible();

    const dragRail = dialog.locator('.app-shell__chat-drag-rail');
    const railBox = await dragRail.boundingBox();
    expect(railBox).not.toBeNull();
    await page.mouse.move(railBox!.x + railBox!.width / 2, railBox!.y + railBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(railBox!.x + railBox!.width / 2, railBox!.y + railBox!.height / 2 + 120, { steps: 5 });
    await page.mouse.up();
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
    await page.screenshot({ path: reviewArtifactPath(testInfo, 'assistant-mobile-light.png') });

    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    const darkAccessibility = await new AxeBuilder({ page })
      .include('.app-shell__chat-panel--mobile')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(darkAccessibility.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact || ''))).toEqual([]);
    await page.screenshot({ path: reviewArtifactPath(testInfo, 'assistant-mobile-dark.png') });

    await input.fill('¿Qué ponen ahora en La 1?');
    await dialog.getByRole('button', { name: 'Enviar mensaje' }).click();
    await expect(dialog.getByRole('status')).toContainText(/Conectando|Consultando/);
    await expect(dialog.getByRole('button', { name: 'Detener respuesta' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Detener respuesta' }).click();
    await expect(dialog.getByRole('button', { name: 'Reintentar última consulta' })).toBeVisible();

    expect(await dialog.evaluate((element) => element.scrollWidth)).toBeLessThanOrEqual(390);

    await dialog.getByRole('button', { name: 'Abrir chat con personas' }).click();
    await expect(dialog.getByRole('heading', { name: 'Personas' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Cerrar o minimizar chat' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Volver al asistente' }).click();
    await expect(input).toBeVisible();
  });

  test('mobile assistant fills small and breakpoint viewports without horizontal overflow', async ({ page, context }) => {
    await mockAuthBackend(context);
    await page.addInitScript(() => {
      localStorage.setItem('gtv_id_token', 'e2e-mock-access-token');
      localStorage.setItem('gtv_refresh_token', 'e2e-mock-refresh-token');
    });

    for (const viewport of [{ width: 320, height: 568 }, { width: 767, height: 600 }]) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await page.locator('.app-shell__chat-fab').click();
      const dialog = page.getByRole('dialog', { name: 'Asistente GuíaTV' });
      await expect(dialog).toBeVisible();
      const bounds = await dialog.boundingBox();
      expect(Math.round(bounds?.width || 0)).toBe(viewport.width);
      expect(Math.round(bounds?.height || 0)).toBe(viewport.height);
      expect(await dialog.evaluate((element) => element.scrollWidth)).toBeLessThanOrEqual(viewport.width);
      await page.keyboard.press('Escape');
    }
  });

  test('platform recommendations are visible as an expandable list in both themes', async ({ page, context }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockAuthBackend(context);
    await page.addInitScript(() => {
      localStorage.setItem('gtv_id_token', 'e2e-mock-access-token');
      localStorage.setItem('gtv_refresh_token', 'e2e-mock-refresh-token');
    });
    const recommendations = Array.from({ length: 8 }, (_, index) => ({
      catalogId: `catalog-${index + 1}`,
      title: `Serie recomendada ${index + 1}`,
      type: 'series',
      platform: index % 2 ? 'Netflix' : 'Max',
      reason: 'Disponible en una de tus plataformas y afín a tus preferencias.',
      badges: ['Drama', '45 min'],
      synopsis: 'Una historia con personajes complejos y capítulos fáciles de encadenar.',
    }));
    await context.route('**/v2/ai/chat/stream', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: [
          'event: result',
          `data: ${JSON.stringify({
            text: 'He encontrado varias opciones en tus plataformas.',
            recommendations: recommendations.slice(0, 3),
            moreRecommendations: recommendations.slice(3),
            queryContext: { mode: 'streaming', requestedTypes: ['series'], totalMatches: 8, primaryMatches: 8, shownCount: 3, hasMore: true, answerWindowLabel: 'Streaming' },
          })}`,
          '',
          'event: done',
          'data: {}',
          '',
        ].join('\n'),
      });
    });

    await page.goto('/');
    await page.locator('.app-shell__chat-fab').click();
    const dialog = page.getByRole('dialog', { name: 'Asistente GuíaTV' });
    const input = dialog.getByRole('textbox', { name: 'Mensaje para el asistente' });
    await input.fill('Recomiéndame series en mis plataformas');
    await dialog.getByRole('button', { name: 'Enviar mensaje' }).click();

    await expect(dialog.locator('app-chat-recommendation-card')).toHaveCount(5);
    await expect(dialog.getByRole('button', { name: 'Ver 3 resultados más' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Vista carrusel' })).toHaveCount(0);
    await dialog.getByRole('button', { name: 'Ver 3 resultados más' }).click();
    await expect(dialog.locator('app-chat-recommendation-card')).toHaveCount(8);
    await page.screenshot({ path: reviewArtifactPath(testInfo, 'assistant-platform-results-light.png') });

    const accessibility = await new AxeBuilder({ page })
      .include('.app-shell__chat-panel--mobile')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(accessibility.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact || ''))).toEqual([]);

    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    const darkAccessibility = await new AxeBuilder({ page })
      .include('.app-shell__chat-panel--mobile')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(darkAccessibility.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact || ''))).toEqual([]);
    await page.screenshot({ path: reviewArtifactPath(testInfo, 'assistant-platform-results-dark.png') });
  });
});
