import { expect, test } from '@playwright/test';
import { mockAuthBackend } from '../fixtures/auth-mock';

/**
 * Two small, previously-untested Mi GuíaTV surfaces:
 *  - Overview's onboarding-completion meter + "Esta noche para ti" rail
 *    (both must reflect real mocked data, never a fabricated percentage or
 *    placeholder recommendation);
 *  - the three privacy controls (share watchlist, public lists by default,
 *    who can message me) that previously had no UI at all — only 3 of the 6
 *    UserPrivacy fields were ever exposed, the other 3 silently defaulted
 *    and could never be changed by the user.
 */
test.describe('Mi GuíaTV overview + privacy controls', () => {
  test('overview shows a real completion meter and hides the for-you rail when there is nothing to recommend', async ({ page, context }) => {
    await mockAuthBackend(context);
    await page.addInitScript(() => {
      localStorage.setItem('gtv_id_token', 'e2e-mock-access-token');
      localStorage.setItem('gtv_refresh_token', 'e2e-mock-refresh-token');
    });

    // /perfil's route data now defaults to 'overview' (previously 'feed' ->
    // 'community' — see app.routes.ts and mapLegacyTab). No `?tab=` param
    // here is deliberate: it IS the regression check that a bare /perfil
    // visit lands on the completion meter + for-you rail, not Community.
    await page.goto('/perfil');
    await expect(page.getByRole('heading', { name: 'Tu Guía TV' })).toBeVisible();

    // Mocked profile/memory are both empty -> 0/7, never a fake percentage.
    await expect(page.getByText('Mejora tus recomendaciones')).toBeVisible();
    await expect(page.getByText('0/7')).toBeVisible();
    const meter = page.getByRole('progressbar', { name: /0 de 7 preferencias completadas/ });
    await expect(meter).toBeVisible();
    await expect(meter).toHaveAttribute('aria-valuenow', '0');
    await expect(meter).toHaveAttribute('aria-valuemax', '7');

    // mockAuthBackend's catch-all returns { data: [] } for /discovery/for-you
    // -> no items -> the rail must not render at all, not an empty carousel.
    await expect(page.getByText('Esta noche para ti')).toHaveCount(0);
  });

  test('overview renders the for-you rail from real recommendation data when the API returns items', async ({ page, context }) => {
    await mockAuthBackend(context);
    await context.route('**/v2/discovery/for-you**', (route) => route.fulfill({
      json: {
        success: true,
        data: {
          items: [
            {
              item: {
                catalogId: 'tmdb:movie:603',
                source: 'tmdb',
                contentType: 'movie',
                title: 'Matrix',
                genres: ['Acción'],
                primaryPlatforms: ['Max'],
              },
              score: 0.9,
              reason: 'Coincide con tus géneros favoritos',
              matchedGenres: ['Acción'],
            },
          ],
        },
      },
    }));
    await page.addInitScript(() => {
      localStorage.setItem('gtv_id_token', 'e2e-mock-access-token');
      localStorage.setItem('gtv_refresh_token', 'e2e-mock-refresh-token');
    });

    await page.goto('/perfil');
    await expect(page.getByRole('heading', { name: 'Esta noche para ti' })).toBeVisible();
    await expect(page.getByText('Matrix')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ver más' })).toHaveAttribute('href', '/para-ti');
  });

  test('privacy section exposes plain-language controls for shareWatchlist, publicLists and allowMessages, and saves them', async ({ page, context }) => {
    // UserAreaComponent.onSaveSettings routes the privacy half of this form
    // through UserService.updatePrivacy -> PATCH /user/privacy (a separate
    // call from the genres/platforms/discoveryDefaults half, which goes
    // through PATCH /user/profile). See UserService.updatePrivacy.
    let savedPrivacyPatch: Record<string, unknown> | null = null;
    await mockAuthBackend(context);
    await context.route('**/v2/user/privacy', async (route) => {
      if (route.request().method() === 'PATCH') {
        savedPrivacyPatch = route.request().postDataJSON();
        return route.fulfill({ json: { success: true, data: { privacy: savedPrivacyPatch } } });
      }
      return route.fallback();
    });
    await page.addInitScript(() => {
      localStorage.setItem('gtv_id_token', 'e2e-mock-access-token');
      localStorage.setItem('gtv_refresh_token', 'e2e-mock-refresh-token');
    });

    await page.goto('/perfil?tab=account');
    await expect(page.getByRole('heading', { name: 'Ajustes de cuenta' })).toBeVisible();

    // Plain language, not raw field names.
    await expect(page.getByText('Compartir mi lista de guardados')).toBeVisible();
    await expect(page.getByText('Listas públicas por defecto')).toBeVisible();
    await expect(page.getByText('Quién puede escribirme')).toBeVisible();
    await expect(page.getByText('shareWatchlist', { exact: false })).toHaveCount(0);
    await expect(page.getByText('allowMessages', { exact: false })).toHaveCount(0);
    await expect(page.getByText('publicLists', { exact: false })).toHaveCount(0);

    const messagesGroup = page.getByRole('radiogroup', { name: 'Quién puede escribirme' });
    await expect(messagesGroup.getByRole('radio', { name: 'Todos' })).toHaveAttribute('aria-checked', 'true');
    await messagesGroup.getByRole('radio', { name: 'Solo seguidores' }).click();
    await expect(messagesGroup.getByRole('radio', { name: 'Solo seguidores' })).toHaveAttribute('aria-checked', 'true');

    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect.poll(() => savedPrivacyPatch).not.toBeNull();
    expect(savedPrivacyPatch).toMatchObject({
      allowMessages: 'followers',
      shareWatchlist: true,
      publicLists: true,
    });
  });

  test('desktop nav exposes all 7 destinations with no separate Streaming/Avisos entries, and old tab links still resolve to Cuenta', async ({ page, context }) => {
    await mockAuthBackend(context);
    await page.addInitScript(() => {
      localStorage.setItem('gtv_id_token', 'e2e-mock-access-token');
      localStorage.setItem('gtv_refresh_token', 'e2e-mock-refresh-token');
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/perfil');
    const desktopNav = page.getByRole('navigation', { name: 'Navegación de Mi GuíaTV' });
    for (const label of ['Resumen', 'Mi TV', 'Deportes', 'Biblioteca', 'Comunidad', 'Asistente', 'Cuenta']) {
      await expect(desktopNav.getByRole('button', { name: label })).toBeVisible();
    }
    await expect(desktopNav.getByRole('button', { name: 'Streaming' })).toHaveCount(0);
    await expect(desktopNav.getByRole('button', { name: 'Avisos' })).toHaveCount(0);

    // 'streaming'/'notifications' were separate nav entries rendering the
    // exact same <app-user-settings> as 'account' — both are now backward-
    // compat aliases for the single surviving 'account' tab (mapLegacyTab).
    await page.goto('/perfil?tab=streaming');
    await expect(page.getByRole('heading', { name: 'Ajustes de cuenta' })).toBeVisible();
    await page.goto('/perfil?tab=notifications');
    await expect(page.getByRole('heading', { name: 'Ajustes de cuenta' })).toBeVisible();
  });
});
