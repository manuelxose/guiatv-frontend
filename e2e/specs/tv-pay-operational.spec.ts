import { test, expect } from '@playwright/test';

type ReadItem = {
  channel?: { id?: string; name?: string; group?: string };
  program?: { title?: string };
};

const BACKEND_URL = process.env.E2E_BACKEND_URL || 'http://127.0.0.1:4310';

test.describe('TV pay/Movistar operational journeys', () => {
  test('renders a real pay-TV channel selected from the live read model', async ({ page, request }) => {
    const response = await request.get(`${BACKEND_URL}/v2/tv/read?view=day&group=cable&limit=5000`);
    expect(response.ok()).toBeTruthy();
    const payload = await response.json();
    const items = (payload?.data?.items || []) as ReadItem[];
    const item = items.find((entry) => entry.channel?.id && entry.channel?.name);

    expect(items.length, 'the operational API must expose real cable/pay-TV rows').toBeGreaterThan(0);
    expect(item?.channel?.id).toBeTruthy();
    expect(item?.channel?.name).toBeTruthy();

    await page.goto('/programacion-tv/guia-canales?group=cable&liveView=day');
    await expect(page.getByText(item.channel.name!, { exact: true }).first()).toBeVisible({ timeout: 20_000 });
  });

  test('searches a canonical pay channel through the real API and UI', async ({ page, request }) => {
    const response = await request.get(`${BACKEND_URL}/v2/tv/read?view=search&q=TCM&limit=5`);
    expect(response.ok()).toBeTruthy();
    const payload = await response.json();
    const tcm = (payload?.data?.items || []).find((entry: ReadItem) => entry.channel?.id === 'tcm');
    expect(tcm?.channel?.id, 'TCM must resolve from canonical read data').toBe('tcm');

    await page.goto('/programacion-tv/guia-canales?q=TCM');
    await expect(page.getByText('TCM', { exact: true }).first()).toBeVisible({ timeout: 20_000 });
  });
});
