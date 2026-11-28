import { expect, test } from '@playwright/test';

test('opens the import card and exposes the offline state', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '从一张 PNG 开始' })).toBeVisible();
  await expect(page.getByText(/离线/).first()).toBeVisible();
  expect(requests.every((url) => new URL(url).hostname === '127.0.0.1')).toBe(true);
});

test('imports and previews a local PNG', async ({ page }) => {
  await page.goto('/');
  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByText('导入 PNG').first().click();
  const chooser = await chooserPromise;
  await chooser.setFiles('public/fixtures/roundtrip-4x3.png');
  await expect(page.getByLabel(/图像预览 4×3/)).toBeVisible();
  await expect(page.getByText('roundtrip-4x3.png')).toBeVisible();
  await expect(page.getByRole('button', { name: '导出 PNG' })).toBeEnabled();
});

test('restores the latest project from IndexedDB after reload', async ({ page }) => {
  await page.goto('/');
  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByText('导入 PNG').first().click();
  const chooser = await chooserPromise;
  await chooser.setFiles('public/fixtures/roundtrip-4x3.png');
  await expect(page.getByLabel(/图像预览 4×3/)).toBeVisible();
  await page.reload();
  await expect(page.getByLabel(/图像预览 4×3/)).toBeVisible();
  await expect(page.getByText('已恢复本地项目。')).toBeVisible();
});

test('fits a large imported image to the canvas area', async ({ page }) => {
  await page.goto('/');
  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByText('导入 PNG').first().click();
  const chooser = await chooserPromise;
  await chooser.setFiles('public/fixtures/roundtrip-2048x1024.png');
  const preview = page.getByLabel(/图像预览 2048×1024/);
  await expect(preview).toBeVisible();
  await expect.poll(async () => (await preview.boundingBox())?.width ?? 0).toBeGreaterThan(400);
  const box = await preview.boundingBox();
  expect(box?.width ?? 0).toBeGreaterThan(400);
  expect(box?.height ?? 0).toBeGreaterThan(200);
});

test('exposes the Phase 2 visual assistance panel after import', async ({ page }) => {
  await page.goto('/');
  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByText('导入 PNG').first().click();
  const chooser = await chooserPromise;
  await chooser.setFiles('public/fixtures/roundtrip-4x3.png');
  await expect(page.getByRole('region', { name: 'Phase 2 视觉辅助' })).toBeVisible();
  await expect(page.getByRole('button', { name: '分析缺口' })).toBeEnabled();
  await page.getByRole('button', { name: '分析缺口' }).click();
  await expect(page.getByText(/已找到 .* 个待确认候选/)).toBeVisible({ timeout: 10_000 });
});
