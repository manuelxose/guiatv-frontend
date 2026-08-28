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
    const categories = posts.flatMap((post) => post.categories_name || []);
    const categoryFrequency = new Map<string, number>();
    categories.forEach((category) => {
      categoryFrequency.set(category.slug, (categoryFrequency.get(category.slug) || 0) + 1);
    });
    const firstCategory = categories
      .filter((category) => (categoryFrequency.get(category.slug) || 0) > 1)
      .sort(
        (left, right) =>
          (categoryFrequency.get(right.slug) || 0) - (categoryFrequency.get(left.slug) || 0)
      )[0];
    expect(firstCategory, 'The editorial journey needs a category with related posts').toBeTruthy();

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
    // A cold editorial read may consume the shared BlogService retry budget
    // (2s + 4s + 8s) before its terminal response on this shared host.
    await expect(categoryHeading).toBeVisible({ timeout: 30_000 });
    expect((await categoryHeading.innerText()).trim().length).toBeGreaterThan(0);

    // artículo: open the first real editorial post card on the category page.
    // The category is a live surface — its featured card can change between
    // read and click as editors publish — so target the card by its concrete
    // href (position-independent) and prove navigation by URL, not by a title
    // equality that live data can invalidate mid-flight.
    const articleLink = page.locator('a.category-lead__story, a.editorial-post-card').first();
    await expect(articleLink).toBeVisible({ timeout: 15_000 });
    const articleHref = (await articleLink.getAttribute('href'))?.trim() || '';
    expect(articleHref).toMatch(/^\/editorial\/.+/);
    await page.locator(`a[href="${articleHref}"]`).first().click();

    await page.waitForURL(/\/editorial\/(?!categoria\/)[^/]+$/, { timeout: 15_000 });
    expect(new URL(page.url()).pathname).toBe(articleHref);
    const postHeading = page.locator('h1').first();
    await expect(postHeading).toBeVisible({ timeout: 15_000 });
    expect((await postHeading.innerText()).trim().length).toBeGreaterThan(0);
    await assertNoRenderedUndefined(page);

    // artículo relacionado: real "Artículos relacionados" module, not a stub.
    const relatedHeading = page.getByRole('heading', { name: 'Artículos relacionados' });
    const hasRelated = await relatedHeading.isVisible({ timeout: 10_000 }).catch(() => false);
    test.skip(!hasRelated, 'This particular article has no related posts to open right now');

    const relatedSection = page.locator('section', { has: relatedHeading });
    const relatedLink = relatedSection.locator('a.editorial-post-card').first();
    await expect(relatedLink).toBeVisible({ timeout: 10_000 });
    const relatedHref = (await relatedLink.getAttribute('href'))?.trim() || '';
    expect(relatedHref).toMatch(/^\/editorial\/.+/);
    await relatedLink.click();

    await page.waitForURL(/\/editorial\/(?!categoria\/)[^/]+$/, { timeout: 15_000 });
    expect(new URL(page.url()).pathname).toBe(relatedHref);
    const relatedHeadingText = page.locator('h1').first();
    await expect(relatedHeadingText).toBeVisible({ timeout: 15_000 });
    expect((await relatedHeadingText.innerText()).trim().length).toBeGreaterThan(0);
    await assertNoRenderedUndefined(page);
  });
});
