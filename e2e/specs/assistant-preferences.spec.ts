import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockAuthBackend } from '../fixtures/auth-mock';
import { reviewArtifactPath } from '../fixtures/review-artifact';

/**
 * Mi GuíaTV's "Asistente" tab (/perfil?tab=assistant, AssistantPreferencesComponent)
 * is a distinct surface from the floating AI-chatbot dialog covered by
 * assistant.spec.ts — that spec never navigates to /perfil, so this tab had
 * zero E2E coverage before this file. It is the transparency/edit surface for
 * assistant memory described in the Mi GuíaTV personalization work: it must
 * show real (mocked) profile + assistant-memory data, let the shared
 * ChatProfilePanel be reused inline to edit it, and surface real save/ reset
 * errors — never a fabricated widget.
 */
test.describe('Mi GuíaTV assistant preferences tab', () => {
  async function gotoAssistantTab(page: import('@playwright/test').Page, context: import('@playwright/test').BrowserContext) {
    await mockAuthBackend(context);
    await page.addInitScript(() => {
      localStorage.setItem('gtv_id_token', 'e2e-mock-access-token');
      localStorage.setItem('gtv_refresh_token', 'e2e-mock-refresh-token');
    });
    await page.goto('/perfil?tab=assistant');
    await expect(page.getByRole('heading', { name: 'Personalización del asistente' })).toBeVisible();
  }

  test('renders real (empty) profile + assistant-memory data with no console or network errors', async ({ page, context }, testInfo) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    const failedResponses: string[] = [];
    page.on('response', (response) => {
      if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
    });

    await gotoAssistantTab(page, context);

    // Mocked profile/memory are both empty — every group must show the real
    // empty state, not a placeholder pretending to have data.
    for (const title of ['Plataformas', 'Géneros', 'Suele ver contenido', 'Duración preferida', 'Títulos de referencia', 'TV autonómica', 'Prefiere evitar']) {
      await expect(page.getByRole('heading', { name: title })).toBeVisible();
    }
    await expect(page.getByText('Sin definir todavía.')).toHaveCount(7);
    await expect(page.getByText('0/7 completadas')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Editar preferencias' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Restablecer preferencias del asistente' })).toBeVisible();

    await page.screenshot({ path: reviewArtifactPath(testInfo, 'assistant-preferences-empty-light.png'), fullPage: true });

    expect(consoleErrors).toEqual([]);
    expect(failedResponses).toEqual([]);
  });

  test('passes axe on light and dark themes', async ({ page, context }, testInfo) => {
    await gotoAssistantTab(page, context);

    const light = await new AxeBuilder({ page })
      .include('app-assistant-preferences')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(light.violations.filter((v) => ['critical', 'serious'].includes(v.impact || ''))).toEqual([]);

    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await page.screenshot({ path: reviewArtifactPath(testInfo, 'assistant-preferences-empty-dark.png'), fullPage: true });
    const dark = await new AxeBuilder({ page })
      .include('app-assistant-preferences')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(dark.violations.filter((v) => ['critical', 'serious'].includes(v.impact || ''))).toEqual([]);
  });

  test('is reachable from the mobile tab nav and fits small/tablet/desktop viewports without horizontal overflow', async ({ page, context }) => {
    await mockAuthBackend(context);
    await page.addInitScript(() => {
      localStorage.setItem('gtv_id_token', 'e2e-mock-access-token');
      localStorage.setItem('gtv_refresh_token', 'e2e-mock-refresh-token');
    });

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/perfil');
    await page.getByRole('navigation', { name: 'Navegación privada' }).getByRole('button', { name: 'Asistente' }).click();
    await expect(page.getByRole('heading', { name: 'Personalización del asistente' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);

    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.getByRole('heading', { name: 'Personalización del asistente' })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
  });

  test('editing reuses the shared ChatProfilePanel (not a second divergent UI) and surfaces a real save error', async ({ page, context }) => {
    await mockAuthBackend(context);
    // The platforms question is profile-target (see PreferenceQuestion.target
    // in chat-profile.types.ts): ChatbotService.applyPreferenceAnswer routes
    // it through UserService.saveGenrePreferences -> PATCH /user/profile, not
    // /ai/memory. Force that call to fail to exercise the real error path.
    await context.route('**/v2/user/profile', async (route) => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({ status: 500, json: { success: false, error: { message: 'boom' } } });
      }
      return route.fallback();
    });
    await page.addInitScript(() => {
      localStorage.setItem('gtv_id_token', 'e2e-mock-access-token');
      localStorage.setItem('gtv_refresh_token', 'e2e-mock-refresh-token');
    });

    await page.goto('/perfil?tab=assistant');
    await page.getByRole('button', { name: 'Editar preferencias' }).click();

    // Same component/heading/copy as the chatbot's own "Completar Perfil IA"
    // panel (see assistant.spec.ts) — proof this is the shared facade, not a
    // parallel reimplementation.
    await expect(page.getByRole('heading', { name: 'Perfil IA' })).toBeVisible();
    const backButton = page.getByRole('button', { name: 'Cerrar edición' });
    await expect(backButton).toBeVisible();
    await expect(page.getByRole('button', { name: 'Volver al chat' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Netflix' }).click();
    await page.getByRole('button', { name: 'Guardar y continuar' }).click();
    await expect(page.getByText('No se pudo guardar. Inténtalo de nuevo.')).toBeVisible();

    await backButton.click();
    await expect(page.getByRole('heading', { name: 'Personalización del asistente' })).toBeVisible();
  });

  test('reset asks for confirmation before calling DELETE /ai/memory', async ({ page, context }) => {
    await mockAuthBackend(context);
    let resetCalls = 0;
    await context.route('**/v2/ai/memory', async (route) => {
      if (route.request().method() === 'DELETE') {
        resetCalls += 1;
        return route.fulfill({ json: { success: true, data: { memory: {} } } });
      }
      return route.fallback();
    });
    await page.addInitScript(() => {
      localStorage.setItem('gtv_id_token', 'e2e-mock-access-token');
      localStorage.setItem('gtv_refresh_token', 'e2e-mock-refresh-token');
    });

    await page.goto('/perfil?tab=assistant');

    page.once('dialog', (dialog) => dialog.dismiss());
    await page.getByRole('button', { name: 'Restablecer preferencias del asistente' }).click();
    expect(resetCalls).toBe(0);

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Restablecer preferencias del asistente' }).click();
    await expect.poll(() => resetCalls).toBe(1);
  });
});
