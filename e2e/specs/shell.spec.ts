import { expect, test } from '@playwright/test';

test.describe('Shared responsive shell', () => {
  test('mobile exposes the four product sections and keeps chat above navigation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/programacion-tv/guia-canales');

    const nav = page.getByRole('navigation', { name: 'Navegación principal móvil' });
    await expect(nav).toBeVisible();
    const tabs = nav.getByRole('link');
    await expect(tabs).toHaveCount(4);
    expect(new Set(await tabs.evaluateAll((items) => items.map((item) => item.getAttribute('href')))).size).toBe(4);
    await expect(nav.getByRole('link', { name: 'TV', exact: true })).toHaveAttribute('aria-current', 'page');

    const chat = page.getByRole('button', { name: 'Abrir asistente de recomendaciones' });
    await expect(chat).toBeVisible();
    const [chatBox, navBox] = await Promise.all([chat.boundingBox(), nav.boundingBox()]);
    expect(chatBox).not.toBeNull();
    expect(navBox).not.toBeNull();
    expect(chatBox!.y + chatBox!.height).toBeLessThanOrEqual(navBox!.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  });

  test('theme choice applies globally and survives navigation', async ({ page }) => {
    await page.goto('/editorial');
    const themeButton = page.locator('.unified-top-nav__theme');
    await themeButton.click();
    const selectedTheme = await page.locator('html').getAttribute('data-theme');
    expect(['light', 'dark']).toContain(selectedTheme);

    await page.goto('/deportes');
    await expect(page.locator('html')).toHaveAttribute('data-theme', selectedTheme!);
  });

  test('chat opens from the desktop shell and exposes IA and Personas modes', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Abrir asistente de recomendaciones' }).click();

    const panel = page.locator('.app-shell__chat-panel--desktop');
    await expect(panel).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Asistente', exact: true })).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Personas', exact: true })).toBeVisible();
  });
});
