import { test, expect } from '@playwright/test';
const BASE = 'http://localhost:3000';
const API = 'http://localhost:8080';

async function createFloor(request: any, template = 'default') {
  const appState: Record<string, unknown> = { viewBackgroundColor: '#f5f5f5', gridSize: 20 };
  if (template === 'isometric') appState.templateId = 'isometric';
  const res = await request.post(`${API}/api/floors`, {
    data: { name: `test-${template}-${Date.now()}`, excalidrawScene: { elements: [], appState } },
  });
  return (await res.json()).slug;
}

async function joinFloor(page: any, slug: string) {
  await page.goto(`${BASE}/f/${slug}`);
  await page.fill('input[placeholder*="名前"]', 'tester');
  await page.click('button:has-text("入室")');
  await page.waitForSelector('input[placeholder*="メンバーを検索"]', { timeout: 15000 });
  await page.waitForTimeout(2000);
  const skipBtn = page.locator('text=あとで');
  if (await skipBtn.isVisible()) await skipBtn.click();
  await page.waitForTimeout(500);
}

async function enterEditMode(page: any, slug: string) {
  // Set legacy edit token for test
  const res = await fetch(`${API}/api/floors/${slug}`);
  await page.evaluate((s: string) => {
    sessionStorage.setItem(`ethereal-owner-${s}`, 'true');
  }, slug);
  await page.reload();
  await page.waitForSelector('input[placeholder*="メンバーを検索"]', { timeout: 15000 });
  await page.waitForTimeout(2000);
  const skip2 = page.locator('text=あとで');
  if (await skip2.isVisible()) await skip2.click();
  await page.waitForTimeout(500);
  await page.click('[title*="フロアを編集"]');
  await page.waitForSelector('text=スペースを追加', { timeout: 5000 });
}

for (const spaceType of ['デスクエリア', '会議室', 'ラウンジ', 'カフェスペース']) {
  test(`SpaceWizard: ${spaceType} creates without errors`, async ({ page, request }) => {
    const errors: string[] = [];
    page.on('pageerror', (err: Error) => errors.push(err.message));

    const slug = await createFloor(request, 'default');
    await joinFloor(page, slug);
    await enterEditMode(page, slug);

    // Open wizard
    await page.click('text=スペースを追加');
    await page.waitForSelector('text=スペース種類', { timeout: 5000 });

    // Select type within the wizard dialog
    const wizard = page.locator('.fixed.inset-0');
    await wizard.locator(`text=${spaceType}`).first().click();
    await page.waitForTimeout(300);

    // Scroll wizard to bottom and click create
    const createBtn = wizard.locator('button:has-text("スペースを作成")');
    await createBtn.scrollIntoViewIfNeeded();
    await createBtn.click();
    await page.waitForTimeout(3000);

    // Check no critical errors
    const criticalErrors = errors.filter(e => e.includes('Cannot read properties') || e.includes('more hooks'));
    expect(criticalErrors).toHaveLength(0);

    // Verify Excalidraw still renders
    const canvasCount = await page.locator('.excalidraw canvas').count();
    expect(canvasCount).toBeGreaterThan(0);
  });
}

test('Isometric template floor renders without crash', async ({ page, request }) => {
  const errors: string[] = [];
  page.on('pageerror', (err: Error) => errors.push(err.message));

  const slug = await createFloor(request, 'isometric');
  await joinFloor(page, slug);
  await page.waitForTimeout(5000);

  const criticalErrors = errors.filter(e => e.includes('Cannot read properties') || e.includes('more hooks'));
  expect(criticalErrors).toHaveLength(0);

  const canvasCount = await page.locator('.excalidraw canvas').count();
  expect(canvasCount).toBeGreaterThan(0);
});
