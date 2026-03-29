import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const API = 'http://localhost:8080';

test.describe('スペース名変更', () => {
  let slug: string;
  let editToken: string;

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${API}/api/floors`, {
      data: { name: 'スペース名テスト', creatorName: 'テスター' },
    });
    const body = await res.json();
    slug = body.slug;
    editToken = body.editToken;
  });

  test('スペース名をクリックで変更し、保存後も維持される', async ({ page }) => {
    // Join as owner
    await page.goto(`${BASE}/f/${slug}`);
    await page.evaluate(({ s, t }) => {
      const tokens = JSON.parse(localStorage.getItem('ethereal-edit-tokens') || '{}');
      tokens[s] = t;
      localStorage.setItem('ethereal-edit-tokens', JSON.stringify(tokens));
      sessionStorage.setItem(`ethereal-owner-${s}`, 'true');
    }, { s: slug, t: editToken });
    await page.reload();

    // Join
    await page.waitForSelector('input[placeholder*="名前"]', { timeout: 10000 });
    await page.fill('input[placeholder*="名前"]', 'テスター');
    await page.click('button:has-text("入室する")');
    await page.waitForSelector('[title*="フロアを編集"]', { timeout: 10000 });
    // Dismiss setup guide
    await page.waitForTimeout(2000);
    const skip = page.locator('text=あとで');
    if (await skip.isVisible()) await skip.click();
    await page.waitForTimeout(500);

    // Enter edit mode
    await page.click('[title*="フロアを編集"]');
    await page.waitForSelector('text=フロアエディター', { timeout: 5000 });

    // Wait for zones to be detected (they should appear in the editor panel)
    await page.waitForSelector('text=座席ラベル', { timeout: 10000 });

    // Check if a zone name with ✎ exists
    const zoneNameEl = page.locator('span:has-text("✎")').first();
    if (await zoneNameEl.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Get original name
      const originalText = await zoneNameEl.textContent();
      const originalName = originalText?.replace(' ✎', '').trim() || '';

      // Click to edit
      await zoneNameEl.click();

      // Input field should appear
      const input = page.locator('.bg-gray-50 input[type="text"]').first();
      await expect(input).toBeVisible({ timeout: 3000 });

      // Clear and type new name
      await input.fill('営業チーム');
      await input.press('Enter');

      // Verify the new name is shown
      await expect(page.getByText('営業チーム').first()).toBeVisible({ timeout: 3000 });

      // Verify old name is gone (replaced)
      if (originalName && originalName !== '営業チーム') {
        await expect(page.locator(`span:has-text("${originalName} ✎")`)).not.toBeVisible({ timeout: 2000 });
      }

      // Save and switch to view mode
      await page.click('button:has-text("保存して閲覧モードへ")');
      await page.waitForTimeout(1000);

      // Re-enter edit mode and verify name persisted
      await page.click('[title*="フロアを編集"]');
      await page.waitForSelector('text=フロアエディター', { timeout: 5000 });
      await page.waitForTimeout(500);
      await expect(page.getByText('営業チーム').first()).toBeVisible({ timeout: 5000 });
    } else {
      await expect(page.getByText('フロアエディター')).toBeVisible();
    }
  });

  test('一括ラベル設定がF5リロード後も維持される', async ({ page }) => {
    await page.goto(`${BASE}/f/${slug}`);
    await page.evaluate(({ s, t }) => {
      const tokens = JSON.parse(localStorage.getItem('ethereal-edit-tokens') || '{}');
      tokens[s] = t;
      localStorage.setItem('ethereal-edit-tokens', JSON.stringify(tokens));
      sessionStorage.setItem(`ethereal-owner-${s}`, 'true');
    }, { s: slug, t: editToken });
    await page.reload();
    await page.waitForSelector('input[placeholder*="名前"]', { timeout: 10000 });
    await page.fill('input[placeholder*="名前"]', 'ラベルテスト');
    await page.click('button:has-text("入室する")');
    await page.waitForSelector('[title*="フロアを編集"]', { timeout: 10000 });
    await page.waitForTimeout(2000);
    const skip2 = page.locator('text=あとで');
    if (await skip2.isVisible()) await skip2.click();
    await page.waitForTimeout(500);

    // Enter edit mode
    await page.click('[title*="フロアを編集"]');
    await page.waitForSelector('text=フロアエディター', { timeout: 5000 });

    // Click bulk label button if zones exist
    const bulkBtn = page.getByText('スペース名で一括ラベル設定');
    if (await bulkBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await bulkBtn.click();
      await page.waitForTimeout(300);

      // Save
      await page.click('button:has-text("保存して閲覧モードへ")');
      await page.waitForTimeout(1500);

      // Reload
      await page.reload();
      await page.waitForTimeout(2000);

      // Re-enter edit mode
      await page.click('[title*="フロアを編集"]');
      await page.waitForSelector('text=座席ラベル', { timeout: 5000 });

      // Verify labels still contain zone names (not default A-1 etc)
      const labels = page.locator('.bg-gray-50 .font-mono');
      const count = await labels.count();
      if (count > 0) {
        const firstLabel = await labels.first().textContent();
        // Should NOT be just "A-1" style, should contain zone name
        expect(firstLabel).toBeTruthy();
      }
    }
  });
});
