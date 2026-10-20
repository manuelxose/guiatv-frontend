import { createServer } from 'node:http';
import { AddressInfo } from 'node:net';
import { test, expect, Locator, Page, Response } from '@playwright/test';

/**
 * Responsive regression guard (Phase 2B): one URL per public template at every
 * audited width. Fails on document-level horizontal overflow, a clipped H1,
 * raw ISO timestamps, uncaught page errors and same-origin 5xx answers.
 *
 * Data-dependent templates (programme, series, film, match, competition,
 * guide) are discovered from their listing page at run time, so no current
 * programme title is hard-coded. A listing that honestly has nothing to link
 * (e.g. no matches today) skips that template with the reason; a listing that
 * fails to load fails the test.
 *
 * Runs against the usual dev-server setup, or any deployed/candidate origin:
 *   E2E_BASE_URL=http://127.0.0.1:3191 npx playwright test e2e/specs/responsive.spec.ts
 */

const WIDTHS = [320, 360, 375, 390, 428, 768, 1024, 1440];

const STATIC_ROUTES: Record<string, string> = {
  home: '/',
  'tv-guide': '/programacion-tv/en-directo',
  channels: '/canales',
  channel: '/canales/la-1',
  'channel-regional': '/canales/tv3',
  'what-to-watch': '/programacion-tv/que-ver-hoy',
  platforms: '/plataformas',
  comparator: '/comparador-streaming',
  'football-hub': '/deportes/futbol',
  'football-today': '/deportes/futbol/partidos-hoy',
  guides: '/guias',
  rankings: '/guias/rankings',
  trends: '/tendencias',
  embed: '/embed',
  widget: '/embed/programacion',
  legal: '/avisolegal',
};

const DISCOVERED_ROUTES: Record<string, { listing: string; link: RegExp }> = {
  programme: { listing: '/programacion-tv/que-ver-hoy', link: /^\/programas\/[^/?#]+$/ },
  series: { listing: '/programacion-tv/series', link: /^\/series\/[^/?#]+$/ },
  movie: { listing: '/programacion-tv/peliculas', link: /^\/peliculas\/[^/?#]+$/ },
  'football-competition': { listing: '/deportes/futbol/competiciones', link: /^\/deportes\/futbol\/competiciones\/[^/?#]+$/ },
  'football-match': { listing: '/deportes/futbol/partidos-hoy', link: /^\/deportes\/futbol\/partido\/[^/?#]+$/ },
  guide: { listing: '/guias', link: /^\/guias\/(?!categoria\/|rankings$)[^/?#]+$/ },
};

const ISO_INSTANT = /\b\d{4}-\d\d-\d\dT\d\d:\d\d/;

/** Fails loudly on an unusable answer: a 503 here means the API behind the page is down, not that the page passed. */
function assertDocument(path: string, res: Response | null): void {
  expect(res, `${path}: no document response`).not.toBeNull();
  expect(res!.status(), `${path}: HTTP ${res!.status()}${res!.status() === 503 ? ' (API unavailable — rerun when it is up)' : ''}`).toBeLessThan(400);
}

const discovered = new Map<string, Promise<string | null>>();
function discover(page: Page, name: string): Promise<string | null> {
  if (!discovered.has(name)) {
    const { listing, link } = DISCOVERED_ROUTES[name];
    discovered.set(name, (async () => {
      const res = await page.goto(listing, { waitUntil: 'domcontentloaded' });
      assertDocument(listing, res);
      await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);
      const hrefs = await page.locator('a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href') || ''));
      return hrefs.find((h) => link.test(h)) ?? null;
    })());
  }
  return discovered.get(name)!;
}

/** Document overflow plus the elements that stick out (for the failure message). */
async function measureOverflow(page: Page): Promise<{ overflow: number; culprits: string[] }> {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const label = (el: Element) =>
      el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : '');
    const culprits: string[] = [];
    for (const el of Array.from(document.body.querySelectorAll('*'))) {
      const r = el.getBoundingClientRect();
      if (!r.width || r.right <= vw + 1) continue;
      const style = getComputedStyle(el);
      let clipped = false;
      if (style.position !== 'absolute' && style.position !== 'fixed') {
        for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
          if (getComputedStyle(p).overflowX !== 'visible') { clipped = true; break; }
        }
      }
      if (!clipped && culprits.length < 5) culprits.push(`${label(el.parentElement!)} > ${label(el)} (right ${Math.round(r.right)}px)`);
    }
    return { overflow: document.documentElement.scrollWidth - vw, culprits };
  });
}

async function openAndSettle(page: Page, path: string): Promise<{ pageErrors: string[]; serverErrors: string[] }> {
  const pageErrors: string[] = [];
  const serverErrors: string[] = [];
  const origin = new URL(page.url() === 'about:blank' ? test.info().project.use.baseURL! : page.url()).origin;
  page.on('pageerror', (e) => pageErrors.push(e.message));
  page.on('response', (r) => {
    // Speculation-rules prefetches are refused by Cloudflare with a 503 (cf-speculation-refused); the real request follows.
    if (r.request().headers()['sec-purpose']?.includes('prefetch')) return;
    if (r.status() < 500 || new URL(r.url()).origin !== origin) return;
    const failure = `${r.status()} ${new URL(r.url()).pathname}`;
    // POSTs (telemetry, affiliate resolve) from a candidate whose origin is not on the API's CORS allow-list get a 500
    // from the CORS middleware. Recorded as an annotation, not hidden; page content comes from GETs, which must not fail.
    if (r.request().method() !== 'GET') test.info().annotations.push({ type: 'non-GET 5xx', description: failure });
    else serverErrors.push(failure);
  });
  const res = await page.goto(path, { waitUntil: 'domcontentloaded' });
  assertDocument(path, res);
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);
  return { pageErrors, serverErrors };
}

const TEMPLATES = [...Object.keys(STATIC_ROUTES), ...Object.keys(DISCOVERED_ROUTES)];

for (const name of TEMPLATES) {
  test.describe(`responsive: ${name}`, () => {
    for (const width of WIDTHS) {
      test(`${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 844 });
        let path = STATIC_ROUTES[name];
        if (!path) {
          const found = await discover(page, name);
          test.skip(!found, `${DISCOVERED_ROUTES[name].listing} links no ${name} page right now`);
          path = found!;
        }
        const { pageErrors, serverErrors } = await openAndSettle(page, path);

        const { overflow, culprits } = await measureOverflow(page);
        expect(overflow, `${path} @${width}px overflows by ${overflow}px: ${culprits.join(' | ')}`).toBeLessThanOrEqual(0);

        const h1 = page.locator('h1').first();
        await expect(h1, `${path}: no visible H1`).toBeVisible();
        const h1Box = await h1.evaluate((el) => ({ right: el.getBoundingClientRect().right, clipped: el.scrollWidth > el.clientWidth + 1 }));
        expect(h1Box.right, `${path}: H1 runs past the viewport`).toBeLessThanOrEqual(width + 1);
        expect(h1Box.clipped, `${path}: H1 text is clipped`).toBe(false);
        if (!STATIC_ROUTES[name]) {
          // A page linked from its own listing must resolve, not render the "no encontrado" state.
          await expect(h1, `${path}: linked from ${DISCOVERED_ROUTES[name].listing} but renders a not-found state`).not.toHaveText(/no encontrad/i);
        }

        const text = await page.locator('body').innerText();
        expect(text.match(ISO_INSTANT)?.[0] ?? null, `${path}: raw ISO timestamp rendered`).toBeNull();
        expect(pageErrors, `${path}: uncaught page errors`).toEqual([]);
        expect(serverErrors, `${path}: same-origin 5xx responses`).toEqual([]);
      });
    }
  });
}

test.describe('responsive: primary navigation', () => {
  /** Every visible link/button in `scope` fits the viewport and is at least 24px (WCAG 2.2 2.5.8). */
  async function assertTargets(scope: Locator, width: number, label: string): Promise<void> {
    const boxes = await scope.locator('a[href], button').evaluateAll((els) =>
      els.map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0)
    );
    expect(boxes.length, `${label}: no visible targets`).toBeGreaterThan(2);
    for (const r of boxes) {
      expect(r.right, `@${width}px ${label}: target off screen`).toBeLessThanOrEqual(width + 1);
      expect(Math.min(r.width, r.height), `@${width}px ${label}: target under 24px`).toBeGreaterThanOrEqual(24);
    }
  }

  for (const width of [320, 390, 768, 1440]) {
    test(`${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await openAndSettle(page, '/');
      const desktop = page.getByRole('navigation', { name: 'Secciones principales' });
      const mobile = page.getByRole('navigation', { name: 'Navegación principal móvil' });
      const nav = (await mobile.isVisible()) ? mobile : desktop;
      await expect(nav, `@${width}px: neither the section tabs nor the mobile tab bar is visible`).toBeVisible();
      await assertTargets(nav, width, 'primary navigation');

      // The mobile "Más" sheet: opens, its destinations are reachable, and it closes again.
      const more = mobile.locator('button[aria-controls="mobile-more-sheet"]');
      if (await more.isVisible()) {
        await more.click();
        const sheet = page.getByRole('dialog', { name: 'Más opciones' });
        await expect(sheet).toBeVisible();
        await expect(more).toHaveAttribute('aria-expanded', 'true');
        await assertTargets(sheet.getByRole('navigation'), width, '"Más" sheet');
        await sheet.getByRole('button', { name: 'Cerrar más opciones' }).click();
        await expect(sheet).toBeHidden();
      }
    });
  }
});

test.describe('embeddable widget in a cross-origin iframe', () => {
  for (const width of [320, 420]) {
    test(`${width}px iframe shows Madrid clock times and the current slot`, async ({ page, baseURL }) => {
      // The host page comes from a real loopback server on another port: cross-origin to the widget, and in the
      // same address space as a 127.0.0.1 candidate (a route-fulfilled page trips Local Network Access checks).
      const hostServer = createServer((_req, res) => {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        res.end(`<!doctype html><iframe title="Guía TV" src="${baseURL}/embed/programacion?channels=4" width="${width}" height="720" style="border:0"></iframe>`);
      });
      await new Promise<void>((ok) => hostServer.listen(0, 'localhost', ok));
      const { port } = hostServer.address() as AddressInfo;
      test.info().attach('host', { body: `http://localhost:${port}/ frames ${baseURL}` });
      await page.goto(`http://localhost:${port}/`);
      const frame = page.frameLocator('iframe');
      const times = frame.locator('.tv-program__hour, .tv-grid__time');
      await expect(times.first(), 'widget rendered no programmes inside the foreign-origin iframe').toBeVisible({ timeout: 30_000 });

      for (const t of await times.allInnerTexts()) expect(t.trim()).toMatch(/^\d\d:\d\d$/);
      const body = await frame.locator('body').innerText();
      expect(body.match(ISO_INSTANT)?.[0] ?? null, 'raw ISO timestamp in widget').toBeNull();

      // Opens on "now", not on the 00:00 slot.
      await expect(frame.getByText('Ahora', { exact: true }).first()).toBeVisible();

      const overflow = await frame.locator('html').evaluate((el) => el.scrollWidth - el.clientWidth);
      expect(overflow, 'widget overflows its iframe').toBeLessThanOrEqual(0);
      hostServer.close();
    });
  }

  test('an explicit ?timeSlot is still honoured and slots stay navigable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openAndSettle(page, '/embed/programacion?timeSlot=0&channels=3');
    const chip = page.getByRole('button', { name: /00:00\s*-\s*03:00/ });
    await expect(chip).toBeVisible({ timeout: 30_000 });
    await expect(chip).toHaveAttribute('aria-expanded', 'false');
    await chip.click();
    await expect(chip).toHaveAttribute('aria-expanded', 'true');
    await page.getByRole('button', { name: '18:00', exact: true }).click();
    await expect(page.getByRole('button', { name: /18:00\s*-\s*21:00/ })).toBeVisible();
  });
});
