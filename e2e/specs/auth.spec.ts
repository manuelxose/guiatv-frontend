import { test, expect } from '@playwright/test';
import { assertNoRenderedUndefined, assertNotBlankScreen } from '../fixtures/helpers';
import { mockAuthBackend, MOCK_USER } from '../fixtures/auth-mock';

/**
 * Journey 7 (brief §28.7): Register/Login -> profile.
 *
 * See fixtures/auth-mock.ts for why this journey mocks /v2/auth/* and
 * /v2/user/* instead of hitting the real, shared backend: it avoids writing
 * a throwaway account into a database this suite doesn't own.
 */
test.describe('Register/Login -> profile', () => {
  test('registering with email lands on a profile page with the real session name', async ({
    page,
    context,
  }) => {
    await mockAuthBackend(context);

    await page.goto('/registro');
    await assertNotBlankScreen(page);

    await page.locator('#register-name').fill(MOCK_USER.name);
    await page.locator('#register-email').fill(MOCK_USER.email);
    await page.locator('#register-password').fill('SuperSecret123');
    await page.locator('#register-confirm').fill('SuperSecret123');
    await page.getByRole('button', { name: 'Crear cuenta con email' }).click();

    await page.waitForURL(/\/perfil/, { timeout: 15_000 });
    await expect(page.getByText(MOCK_USER.name, { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(`@${MOCK_USER.username}`, { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await assertNoRenderedUndefined(page);
  });

  test('logging in with email lands on a profile page with the real session name', async ({
    page,
    context,
  }) => {
    await mockAuthBackend(context);

    await page.goto('/iniciar-sesion');
    await assertNotBlankScreen(page);

    await page.locator('#login-email').fill(MOCK_USER.email);
    await page.locator('#login-password').fill('SuperSecret123');
    await page.getByRole('button', { name: 'Entrar con email' }).click();

    await page.waitForURL(/\/(perfil|mi-cuenta)/, { timeout: 15_000 });
    await expect(page.getByText(MOCK_USER.name, { exact: true })).toBeVisible({ timeout: 15_000 });
    await assertNoRenderedUndefined(page);
  });
});
