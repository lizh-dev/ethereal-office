import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const API = 'http://localhost:8080';

test.describe('SmartOffice E2E', () => {
  let floorSlug: string;

  test.beforeAll(async ({ request }) => {
    // Create a floor via API
    const res = await request.post(`${API}/api/floors`, {
      data: { name: 'E2Eテストフロア', creatorName: 'テスター' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    floorSlug = body.slug;
    expect(floorSlug).toBeTruthy();
  });

  test('landing page loads and has create button', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('h1')).toContainText('チームの距離を、ゼロにする。');
    // The create button is in the CreateFloorSection further down the page
    await expect(page.getByRole('button', { name: 'フロアを作成' })).toBeVisible();
  });

  test('create floor from landing page', async ({ page }) => {
    await page.goto(BASE);
    // Scroll to create section and fill form
    await page.fill('input[placeholder*="開発チームのオフィス"]', 'ブラウザテストフロア');
    await page.fill('input[placeholder*="田中太郎"]', 'テスト太郎');
    await page.click('button:has-text("フロアを作成")');

    // Should redirect to /f/{slug}
    await page.waitForURL(/\/f\/[a-z0-9]+/, { timeout: 10000 });
    // Should show join dialog
    await expect(page.locator('text=フロアに参加するには名前を入力してください')).toBeVisible();
  });

  test('join floor and see office view', async ({ page }) => {
    await page.goto(`${BASE}/f/${floorSlug}`);

    // Should show join dialog with floor name
    await expect(page.locator('text=E2Eテストフロア')).toBeVisible();

    // Fill in name and join
    await page.fill('input[placeholder*="名前"]', 'ユーザーA');
    await page.click('button:has-text("入室する")');

    // Should see office view (sidebar, floor canvas)
    // The app shows the TopBar with SmartOffice branding and search input when joined
    await expect(page.locator('input[placeholder*="メンバーを検索"]')).toBeVisible({ timeout: 10000 });
  });

  test('two users in same floor can see each other', async ({ browser }) => {
    // User A
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    await pageA.goto(`${BASE}/f/${floorSlug}`);
    await pageA.fill('input[placeholder*="名前"]', 'ユーザーA');
    await pageA.click('button:has-text("入室する")');
    await pageA.waitForSelector('input[placeholder*="メンバーを検索"]', { timeout: 10000 });

    // User B
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await pageB.goto(`${BASE}/f/${floorSlug}`);
    await pageB.fill('input[placeholder*="名前"]', 'ユーザーB');
    await pageB.click('button:has-text("入室する")');
    await pageB.waitForSelector('input[placeholder*="メンバーを検索"]', { timeout: 10000 });

    // Wait for WebSocket sync
    await pageA.waitForTimeout(2000);

    // User A should see User B in the right panel (member list)
    const panelA = pageA.getByText('ユーザーB').first();
    await expect(panelA).toBeVisible({ timeout: 5000 });

    // User B should see User A
    const panelB = pageB.getByText('ユーザーA').first();
    await expect(panelB).toBeVisible({ timeout: 5000 });

    await contextA.close();
    await contextB.close();
  });

  test('floor not found shows error', async ({ page }) => {
    await page.goto(`${BASE}/f/nonexistent123`);
    await expect(page.locator('text=フロアが見つかりません')).toBeVisible({ timeout: 10000 });
  });

  test('different floors are isolated', async ({ browser }) => {
    // Create a second floor
    const res = await (await browser.newContext()).request.post(`${API}/api/floors`, {
      data: { name: '別フロア', creatorName: 'テスター2' },
    });
    const floor2 = await res.json();

    // User in floor 1
    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    await pageA.goto(`${BASE}/f/${floorSlug}`);
    await pageA.fill('input[placeholder*="名前"]', 'フロア1ユーザー');
    await pageA.click('button:has-text("入室する")');
    await pageA.waitForSelector('input[placeholder*="メンバーを検索"]', { timeout: 10000 });

    // User in floor 2
    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await pageB.goto(`${BASE}/f/${floor2.slug}`);
    await pageB.fill('input[placeholder*="名前"]', 'フロア2ユーザー');
    await pageB.click('button:has-text("入室する")');
    await pageB.waitForSelector('input[placeholder*="メンバーを検索"]', { timeout: 10000 });

    await pageA.waitForTimeout(2000);

    // Floor 1 user should NOT see Floor 2 user
    const cross = pageA.locator('text=フロア2ユーザー');
    await expect(cross).not.toBeVisible();

    await ctxA.close();
    await ctxB.close();
  });
});
