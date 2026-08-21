import { expect, test } from '@playwright/test';

const routes = [
  { path: '/editorial', heading: /Historias y guías/, active: 'Últimos' },
  { path: '/editorial/rankings', heading: 'Rankings', active: 'Rankings' },
  { path: '/tendencias', heading: 'Tendencias', active: 'Tendencias' },
  { path: '/comparador-streaming', heading: 'Comparador de plataformas', active: 'Comparador' },
] as const;

const viewports = [
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
] as const;

const visualRoutes = [
  '/',
  '/programacion-tv/guia-canales',
  '/programacion-tv/que-ver-hoy',
  '/plataformas',
  '/deportes/futbol',
  '/deportes/futbol/partidos-hoy',
  '/editorial',
  '/editorial/rankings',
  '/tendencias',
  '/comparador-streaming',
  '/editorial/estrenos-en-streaming-esta-semana',
] as const;

test.describe('Canonical Blog and Platforms navigation', () => {
  for (const route of routes) {
    test(`${route.path} exposes its contextual active state`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page.getByRole('heading', { name: route.heading }).first()).toBeVisible();
      const contextLabel = route.path.startsWith('/editorial') || route.path === '/tendencias'
        ? 'Secciones del Blog'
        : 'Secciones de Plataformas';
      await expect(
        page.getByRole('navigation', { name: contextLabel }).getByRole('link', { name: route.active, exact: true })
      ).toHaveAttribute('aria-current', 'page');

      if (route.path.startsWith('/editorial') || route.path === '/tendencias') {
        await expect(page.getByRole('navigation', { name: 'Secciones del Blog' })).toBeVisible();
      } else {
        await expect(page.getByRole('navigation', { name: 'Secciones de Plataformas' })).toBeVisible();
      }
    });
  }

  test('critical hubs do not overflow at supported widths', async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      for (const path of visualRoutes) {
        await page.goto(path);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);
        await page.screenshot({
          path: testInfo.outputPath(`${path.replaceAll('/', '-') || 'home'}-${viewport.width}x${viewport.height}.png`),
        });
      }
    }
  });

  test('renders one search affordance for each responsive mode', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/editorial');
    await expect(page.locator('#unified-search-input')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Buscar', exact: true })).toHaveCount(0);

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('#unified-search-input')).toHaveCount(0);
    const trigger = page.getByRole('button', { name: 'Buscar', exact: true });
    await expect(trigger).toHaveCount(1);
    await trigger.click();
    await expect(page.locator('#unified-search-input')).toHaveCount(1);
    await expect(page.locator('#unified-search-input')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  });

  test('keeps Platforms and Comparator in the same shell and uses working catalog filters', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/plataformas');

    const topNav = page.locator('app-unified-top-nav');
    await expect(topNav).toHaveCount(1);
    await page.getByRole('navigation', { name: 'Secciones de Plataformas' })
      .getByRole('link', { name: 'Comparador', exact: true })
      .click();

    await expect(page).toHaveURL(/\/comparador-streaming/);
    await expect(topNav).toHaveCount(1);
    await expect(page.getByRole('navigation', { name: 'Secciones de Plataformas' })).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'Comparador de plataformas' })).toBeVisible();

    const catalogLink = page.getByRole('link', { name: /Ver catálogo de/ }).first();
    await expect(catalogLink).toHaveAttribute('href', /platform=/);
    await expect(catalogLink).not.toHaveAttribute('href', /platforms=/);
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`Blog and Comparator render in ${theme} theme without broken covers`, async ({ page }) => {
      await page.addInitScript((mode) => localStorage.setItem('guiatv-theme', mode), theme);
      await page.setViewportSize({ width: 1440, height: 900 });

      for (const path of ['/editorial', '/editorial/rankings', '/comparador-streaming']) {
        await page.goto(path);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);
        const failedImages = await page.locator('main img, app-unified-portal-shell img').evaluateAll(
          (images) => images.filter((image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth === 0).length
        );
        expect(failedImages).toBe(0);
      }
    });
  }
});
