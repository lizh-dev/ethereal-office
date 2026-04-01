import { chromium } from '@playwright/test';
import { setTimeout } from 'timers/promises';

const BASE = 'http://localhost:3000';

async function main() {
  // Create floor via API
  const res = await fetch('http://localhost:8080/api/floors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'デモオフィス' }),
  });
  const floor = await res.json();
  console.log('Floor:', floor.slug);

  const browser = await chromium.launch({ headless: false });
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: './public/', size: { width: 1920, height: 1080 } },
  });
  const page = await ctx.newPage();

  // Go to floor (fresh - no localStorage)
  await page.goto(`${BASE}/f/${floor.slug}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await setTimeout(2000);

  // --- Join ---
  console.log('Joining...');
  await page.fill('input[placeholder*="名前"]', '田中太郎');
  await setTimeout(800);
  await page.click('button:has-text("入室する")');
  await setTimeout(3000);

  // --- Add space (click the guide button) ---
  console.log('Adding space...');
  await page.click('button:has-text("スペースを追加する")');
  await setTimeout(1500);

  // Just create with defaults
  await page.click('button:has-text("スペースを作成")');
  await setTimeout(2000);

  // Add meeting room
  console.log('Adding meeting room...');
  await page.click('button:has-text("スペースを追加")');
  await setTimeout(1000);
  // Click 会議室 type (find div containing 会議室 text)
  const meetingOption = page.locator('div', { hasText: /^会議室$/ }).first();
  await meetingOption.click();
  await setTimeout(500);
  await page.click('button:has-text("スペースを作成")');
  await setTimeout(2000);

  // Save
  console.log('Saving...');
  await page.click('button:has-text("保存して閲覧モードへ")');
  await setTimeout(3000);

  // Chat
  console.log('Chat...');
  await page.fill('input[placeholder*="メッセージ"]', 'オフィスが完成しました！');
  await page.press('input[placeholder*="メッセージ"]', 'Enter');
  await setTimeout(3000);

  // Done
  const videoPath = await page.video()?.path();
  console.log('Video:', videoPath);
  await ctx.close();
  await browser.close();
  console.log('Done!');
}

main().catch(e => { console.error(e.message); process.exit(1); });
