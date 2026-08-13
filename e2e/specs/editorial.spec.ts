import { test, expect } from '@playwright/test';
import { assertNoRenderedUndefined, assertNotBlankScreen } from '../fixtures/helpers';

const BACKEND_URL = process.env.E2E_BACKEND_URL || 'http://localhost:4000';

/**
 * Journey 6 (brief §28.6): Editorial -> categoría -> artículo -> artículo relacionado.
 *
 * Setup/data only (never auth/write): reads the real, published editorial
 * posts from the read-only /v2/blog endpoint to know a real category name to
 * look for, so the test isn't guessing at content that may not exist today.
 */
test.describe('Editorial -> categoría -> artículo -> artículo relacionado', () => {
  test('opens a category, opens an article, then opens a related article', async ({ page, request }) => {
    const blogRes = await request.get(`${BACKEND_URL}/v2/blog`);
    expect(blogRes.ok()).toBeTruthy();
    const posts: Array<{ categories_name?: Array<{ name: string; slug: string }> }> = await blogRes.json();
    const firstCategory = posts.flatMap((p) => p.categories_name || [])[0];
    test.skip(!firstCategory, 'No editorial categories available from the backend right now');

    await page.goto('/editorial');
    await assertNotBlankScreen(page);

    const categoryLink = page.getByRole('link', { name: 'Ver categoría' }).first();
    if (await categoryLink.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await categoryLink.click();
    } else {
      await page.goto(`/editorial/categoria/${firstCategory!.slug}`);
    }

    await page.waitForURL(/\/editorial\/categoria\//, { timeout: 15_000 });
    const categoryHeading = page.locator('h1').first();
    await expect(categoryHeading).toBeVisible({ timeout: 15_000 });
    expect((await categoryHeading.innerText()).trim().length).toBeGreaterThan(0);

    // artículo: open the first real editorial post card on the category page.
    const articleLink = page.locator('a.editorial-post-card').first();
    await expect(articleLink).toBeVisible({ timeout: 15_000 });
    const articleTitle = (await articleLink.locator('h2, h3').first().innerText()).trim();
    expect(articleTitle.length).toBeGreaterThan(0);
    await articleLink.click();

    await page.waitForURL(/\/editorial\/(?!categoria\/)[^/]+$/, { timeout: 15_000 });
    const postHeading = page.locator('h1').first();
    await expect(postHeading).toBeVisible({ timeout: 15_000 });
    expect((await postHeading.innerText()).trim()).toBe(articleTitle);
    await assertNoRenderedUndefined(page);

    // artículo relacionado: real "Artículos relacionados" module, not a stub.
    const relatedHeading = page.getByRole('heading', { name: 'Artículos relacionados' });
    const hasRelated = await relatedHeading.isVisible({ timeout: 10_000 }).catch(() => false);
    test.skip(!hasRelated, 'This particular article has no related posts to open right now');

    const relatedSection = page.locator('section', { has: relatedHeading });
    const relatedLink = relatedSection.locator('a.editorial-post-card').first();
    await expect(relatedLink).toBeVisible({ timeout: 10_000 });
    const relatedTitle = (await relatedLink.locator('h3').innerText()).trim();
    expect(relatedTitle.length).toBeGreaterThan(0);
    await relatedLink.click();

    await page.waitForURL(/\/editorial\/(?!categoria\/)[^/]+$/, { timeout: 15_000 });
    const relatedHeadingText = page.locator('h1').first();
    await expect(relatedHeadingText).toBeVisible({ timeout: 15_000 });
    expect((await relatedHeadingText.innerText()).trim()).toBe(relatedTitle);
    await assertNoRenderedUndefined(page);
  });
});
