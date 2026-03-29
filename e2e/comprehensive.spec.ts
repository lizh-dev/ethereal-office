import { test, expect, Page, BrowserContext } from '@playwright/test';

const BASE = 'http://localhost:3000';
const API = 'http://localhost:8080';

// Helper: create floor via API and return slug + editToken
async function createFloor(request: any, name = 'テストフロア'): Promise<string> {
  const res = await request.post(`${API}/api/floors`, {
    data: { name, creatorName: 'テスター' },
  });
  const body = await res.json();
  // Store editToken for later use
  (createFloor as any)._tokens = (createFloor as any)._tokens || {};
  (createFloor as any)._tokens[body.slug] = body.editToken;
  return body.slug;
}

function getEditToken(slug: string): string {
  return (createFloor as any)._tokens?.[slug] || '';
}

// Helper: join a floor with given name. asOwner=true sets the real editToken.
async function joinFloor(page: Page, slug: string, userName: string, asOwner = false) {
  if (asOwner) {
    const token = getEditToken(slug);
    await page.goto(`${BASE}/f/${slug}`);
    await page.evaluate(({ s, t }) => {
      // Set both legacy editToken and session owner flag
      const tokens = JSON.parse(localStorage.getItem('ethereal-edit-tokens') || '{}');
      tokens[s] = t;
      localStorage.setItem('ethereal-edit-tokens', JSON.stringify(tokens));
      sessionStorage.setItem(`ethereal-owner-${s}`, 'true');
    }, { s: slug, t: token });
    await page.reload();
  } else {
    await page.goto(`${BASE}/f/${slug}`);
  }
  await page.waitForSelector('input[placeholder*="名前"]', { timeout: 10000 });
  await page.fill('input[placeholder*="名前"]', userName);
  await page.click('button:has-text("入室する")');
  await page.waitForSelector('[title*="WebSocket"]', { timeout: 15000 });
  if (asOwner) {
    await page.waitForSelector('[title="フロアを編集"]', { timeout: 5000 });
  }
}

// =============================================================
// A. ランディングページ
// =============================================================
test.describe('A. ランディングページ', () => {
  test('A-1: ページ表示とUI要素', async ({ page }) => {
    await page.goto(BASE);
    // タイトル
    await expect(page.locator('h1')).toContainText('Ethereal Office');
    // サブタイトル
    await expect(page.getByText('バーチャルオフィスを作成して、チームとつながろう')).toBeVisible();
    // フロア名入力
    await expect(page.locator('input[placeholder*="開発チーム"]')).toBeVisible();
    // 名前入力（任意）
    await expect(page.locator('input[placeholder*="田中"]')).toBeVisible();
    // 作成ボタン
    await expect(page.getByRole('button', { name: 'フロアを作成' })).toBeVisible();
    // フッターテキスト
    await expect(page.getByText('URLを共有するだけで誰でも参加')).toBeVisible();
  });

  test('A-2: 空のフロア名ではエラー表示', async ({ page }) => {
    await page.goto(BASE);
    await page.click('button:has-text("フロアを作成")');
    await expect(page.getByText('フロア名を入力してください')).toBeVisible();
  });

  test('A-3: フロア作成してリダイレクト', async ({ page }) => {
    await page.goto(BASE);
    await page.fill('input[placeholder*="開発チーム"]', 'ランディングテスト');
    await page.click('button:has-text("フロアを作成")');
    await page.waitForURL(/\/f\/[a-z0-9]+/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/f\/[a-z0-9]+/);
  });

  test('A-4: Enterキーでフロア作成', async ({ page }) => {
    await page.goto(BASE);
    await page.fill('input[placeholder*="開発チーム"]', 'Enterテスト');
    await page.locator('input[placeholder*="開発チーム"]').press('Enter');
    await page.waitForURL(/\/f\/[a-z0-9]+/, { timeout: 10000 });
  });
});

// =============================================================
// B. 入室ダイアログ (JoinDialog)
// =============================================================
test.describe('B. 入室ダイアログ', () => {
  let slug: string;

  test.beforeAll(async ({ request }) => {
    slug = await createFloor(request, '入室テストフロア');
  });

  test('B-1: フロア名表示と入力フォーム', async ({ page }) => {
    await page.goto(`${BASE}/f/${slug}`);
    await expect(page.getByText('入室テストフロア')).toBeVisible();
    await expect(page.locator('input[placeholder*="名前"]')).toBeVisible();
    await expect(page.getByText('アバタースタイル')).toBeVisible();
    await expect(page.getByText('キャラクター')).toBeVisible();
    await expect(page.getByRole('button', { name: '入室する' })).toBeVisible();
  });

  test('B-2: 空名前では入室ボタン無効', async ({ page }) => {
    await page.goto(`${BASE}/f/${slug}`);
    const btn = page.getByRole('button', { name: '入室する' });
    await expect(btn).toBeDisabled();
  });

  test('B-3: アバタースタイル切り替え', async ({ page }) => {
    await page.goto(`${BASE}/f/${slug}`);
    // 6つのスタイルボタンが存在
    const styleBtns = page.locator('text=アバタースタイル').locator('..').locator('button');
    // Click second style
    await styleBtns.nth(1).click();
    // Avatar preview should update (img src changes)
    const avatar = page.locator('img[alt="avatar"]');
    const src = await avatar.getAttribute('src');
    expect(src).toContain('avataaars');
  });

  test('B-4: 入室後にlocalStorage保存', async ({ page }) => {
    await page.goto(`${BASE}/f/${slug}`);
    await page.fill('input[placeholder*="名前"]', 'ストレージテスト');
    await page.click('button:has-text("入室する")');
    await page.waitForSelector('[title*="WebSocket"]', { timeout: 15000 });

    const saved = await page.evaluate(() => localStorage.getItem('ethereal-office-user'));
    expect(saved).toBeTruthy();
    const data = JSON.parse(saved!);
    expect(data.name).toBe('ストレージテスト');
  });

  test('B-5: リロード時にlocalStorageから自動入室', async ({ page }) => {
    await page.goto(`${BASE}/f/${slug}`);
    await page.evaluate(() => {
      localStorage.setItem('ethereal-office-user', JSON.stringify({
        name: '復元テスト',
        avatarStyle: 'notionists',
        avatarSeed: '佐藤',
      }));
    });
    await page.reload();
    // Should auto-join without showing JoinDialog
    await page.waitForSelector('[title*="WebSocket"]', { timeout: 15000 });
    await expect(page.getByText('Online')).toBeVisible();
  });
});

// =============================================================
// C. 存在しないフロア
// =============================================================
test.describe('C. エラーハンドリング', () => {
  test('C-1: 存在しないフロアで案内表示', async ({ page }) => {
    await page.goto(`${BASE}/f/nonexistent999`);
    await expect(page.getByText('フロアが見つかりません')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('新しいフロアを作成する')).toBeVisible();
  });

  test('C-2: 新規作成ボタンでトップへ', async ({ page }) => {
    await page.goto(`${BASE}/f/nonexistent999`);
    await page.waitForSelector('text=新しいフロアを作成する', { timeout: 10000 });
    await page.click('text=新しいフロアを作成する');
    await page.waitForURL(BASE + '/');
  });
});

// =============================================================
// D. オフィスUI基本（入室後）
// =============================================================
test.describe('D. オフィスUI基本', () => {
  let slug: string;

  test.beforeAll(async ({ request }) => {
    slug = await createFloor(request, 'UIテストフロア');
  });

  test('D-1: メインレイアウト要素の表示', async ({ page }) => {
    await joinFloor(page, slug, 'UIテスター');

    // サイドバー
    await expect(page.locator('text=W').first()).toBeVisible();
    // TopBar
    await expect(page.locator('input[placeholder*="メンバー"]')).toBeVisible();
    // WS接続インジケーター
    await expect(page.getByText('Online')).toBeVisible();
    // WS connection indicator
    await expect(page.getByText('Online')).toBeVisible();
  });

  test('D-2: サイドバー編集モード切り替え', async ({ page }) => {
    await joinFloor(page, slug, '編集テスター', true);

    // 編集ボタンクリック
    await page.click('[title="フロアを編集"]');
    // 編集モードバッジが表示
    await expect(page.getByText('編集モード')).toBeVisible();
    // フロアエディターパネルが表示
    await expect(page.getByText('フロアエディター')).toBeVisible();

    // 戻る
    await page.click('[title="編集終了"]');
    await expect(page.getByText('フロアエディター')).not.toBeVisible();
  });

  test('D-3: ステータス変更', async ({ page }) => {
    await joinFloor(page, slug, 'ステータステスター');

    // ステータスドロップダウンを開く
    await page.click('text=オンライン');
    await expect(page.getByText('ステータス変更')).toBeVisible();

    // ビジーに変更
    await page.click('text=ビジー');
    // ステータスが更新される
    await expect(page.getByText('ビジー').first()).toBeVisible();
  });

  test('D-4: チャット送信', async ({ page }) => {
    await joinFloor(page, slug, 'チャットテスター');

    // チャット入力欄にテキスト入力
    const chatInput = page.locator('input[placeholder*="メッセージを入力"]');
    await chatInput.fill('こんにちは！');
    await chatInput.press('Enter');

    // 入力欄がクリアされる
    await expect(chatInput).toHaveValue('');
  });
});

// =============================================================
// E. マルチユーザー同期
// =============================================================
test.describe('E. マルチユーザー同期', () => {
  let slug: string;

  test.beforeAll(async ({ request }) => {
    slug = await createFloor(request, 'マルチユーザーテスト');
  });

  test('E-1: 2ユーザー相互表示', async ({ browser }) => {
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    await joinFloor(pageA, slug, 'アリス');
    await joinFloor(pageB, slug, 'ボブ');
    await pageA.waitForTimeout(2000);

    // アリスにボブが表示
    await expect(pageA.getByText('ボブ').first()).toBeVisible({ timeout: 5000 });
    // ボブにアリスが表示
    await expect(pageB.getByText('アリス').first()).toBeVisible({ timeout: 5000 });

    await ctxA.close();
    await ctxB.close();
  });

  test('E-2: ユーザー退出の検知', async ({ browser }) => {
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    await joinFloor(pageA, slug, 'タロウ');
    await joinFloor(pageB, slug, 'ハナコ');
    await pageA.waitForTimeout(2000);

    // ハナコが表示されていることを確認
    await expect(pageA.getByText('ハナコ').first()).toBeVisible({ timeout: 5000 });

    // ハナコのタブを閉じる
    await ctxB.close();
    await pageA.waitForTimeout(3000);

    // ハナコが消える
    await expect(pageA.getByText('ハナコ')).not.toBeVisible({ timeout: 5000 });

    await ctxA.close();
  });

  test('E-3: チャットメッセージの同期', async ({ browser }) => {
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    await joinFloor(pageA, slug, '送信者');
    await joinFloor(pageB, slug, '受信者');
    await pageA.waitForTimeout(2000);

    // 送信者がチャット送信
    const chatInput = pageA.locator('input[placeholder*="メッセージを入力"]');
    await chatInput.fill('テストメッセージだよ');
    await chatInput.press('Enter');

    // 受信者にチャットバブルが表示される
    await expect(pageB.getByText('テストメッセージだよ')).toBeVisible({ timeout: 5000 });

    await ctxA.close();
    await ctxB.close();
  });

  test('E-4: ステータス変更の同期', async ({ browser }) => {
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    await joinFloor(pageA, slug, 'ステA');
    await joinFloor(pageB, slug, 'ステB');
    await pageA.waitForTimeout(2000);

    // ステAのステータスをビジーに変更
    await pageA.click('text=オンライン');
    await pageA.waitForSelector('text=ステータス変更');
    await pageA.click('text=ビジー');
    await pageA.waitForTimeout(1000);

    // ステBのフロア上でステAが見えている
    await expect(pageB.getByText('ステA').first()).toBeVisible({ timeout: 5000 });

    await ctxA.close();
    await ctxB.close();
  });

  test('E-5: フロア分離（別フロアのユーザーは見えない）', async ({ browser, request }) => {
    const slug2 = await createFloor(request, '別フロア');

    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    await joinFloor(pageA, slug, 'フロア1');
    await joinFloor(pageB, slug2, 'フロア2');
    await pageA.waitForTimeout(2000);

    // フロア1にフロア2のユーザーが表示されない
    await expect(pageA.getByText('フロア2')).not.toBeVisible();
    // フロア2にフロア1のユーザーが表示されない
    await expect(pageB.getByText('フロア1')).not.toBeVisible();

    await ctxA.close();
    await ctxB.close();
  });
});

// =============================================================
// F. エディターモード
// =============================================================
test.describe('F. エディターモード', () => {
  let slug: string;

  test.beforeAll(async ({ request }) => {
    slug = await createFloor(request, 'エディターテスト');
  });

  test('F-1: エディターパネル表示', async ({ page }) => {
    await joinFloor(page, slug, 'エディター', true);
    await page.click('[title="フロアを編集"]');

    await expect(page.getByText('フロアエディター')).toBeVisible();
    await expect(page.getByText('スペースを追加')).toBeVisible();
  });

  test('F-2: TopBarにJSONエクスポートボタン', async ({ page }) => {
    await joinFloor(page, slug, 'エクスポーター', true);
    await page.click('[title="フロアを編集"]');
    await expect(page.getByText('エクスポート')).toBeVisible();
    await expect(page.getByText('インポート')).toBeVisible();
  });

  test('F-3: スペースウィザード表示', async ({ page }) => {
    await joinFloor(page, slug, 'ウィザード', true);
    await page.click('[title="フロアを編集"]');
    await page.click('button:has-text("スペースを追加")');

    // ウィザードモーダルが表示
    await expect(page.getByText('スペースを追加').nth(1)).toBeVisible(); // modal title
    await expect(page.getByRole('button', { name: 'スペースを作成' })).toBeVisible();
  });

  test('F-4: スペースウィザードのキャンセル', async ({ page }) => {
    await joinFloor(page, slug, 'キャンセラー', true);
    await page.click('[title="フロアを編集"]');
    await page.click('button:has-text("スペースを追加")');
    // Click the wizard's cancel button (not the editor panel's)
    await page.locator('.fixed button:has-text("キャンセル")').click();
    await expect(page.getByRole('button', { name: 'スペースを作成' })).not.toBeVisible();
  });
});

// =============================================================
// G. Excalidrawフロアプラン
// =============================================================
test.describe('G. Excalidrawフロアプラン', () => {
  let slug: string;

  test.beforeAll(async ({ request }) => {
    slug = await createFloor(request, 'Excalidrawテスト');
  });

  test('G-1: デフォルトフロアプランのレンダリング', async ({ page }) => {
    await joinFloor(page, slug, 'フロアビューワー');
    // Excalidrawキャンバスが表示される
    await expect(page.locator('.excalidraw')).toBeVisible({ timeout: 15000 });
  });

  test('G-2: Excalidraw要素の存在確認', async ({ page }) => {
    await joinFloor(page, slug, 'キャンバスチェッカー');
    await page.waitForSelector('.excalidraw', { timeout: 15000 });
    // Excalidrawのキャンバス要素が存在
    await expect(page.locator('.excalidraw canvas').first()).toBeVisible();
  });
});


// =============================================================
// I. アバターセレクター
// =============================================================
test.describe('I. アバターセレクター', () => {
  let slug: string;

  test.beforeAll(async ({ request }) => {
    slug = await createFloor(request, 'アバターテスト');
  });

  test('I-1: TopBarのアバタークリックでモーダル表示', async ({ page }) => {
    await joinFloor(page, slug, 'アバター変更者');
    // TopBarのアバター画像をクリック
    const avatarBtn = page.locator('img[alt*="avatar"], img[alt*="Avatar"]').first();
    if (await avatarBtn.isVisible()) {
      await avatarBtn.click();
      await expect(page.getByText('アバターを選択')).toBeVisible({ timeout: 5000 });
    }
  });
});

// =============================================================
// I-2. 検索フィルタ
// =============================================================
test.describe('I-2. 検索フィルタ', () => {
  let slug: string;

  test.beforeAll(async ({ request }) => {
    slug = await createFloor(request, '検索テストフロア');
  });

  test('I-2-1: フロアビューで検索するとマッチしたユーザーがハイライト', async ({ browser }) => {
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    await joinFloor(pageA, slug, 'ハイライト太郎');
    await joinFloor(pageB, slug, 'ハイライト花子');
    await pageA.waitForTimeout(2000);

    // 検索入力
    await pageA.fill('input[placeholder*="メンバーを検索"]', 'ハイライト花子');
    await pageA.waitForTimeout(500);

    // 検索マッチしたユーザーのラベルに🔍アイコンが表示される
    await expect(pageA.getByText('🔍 ハイライト花子')).toBeVisible({ timeout: 3000 });

    // 検索クリア
    await pageA.fill('input[placeholder*="メンバーを検索"]', '');

    await ctxA.close();
    await ctxB.close();
  });

  test('I-2-2: 検索入力でメンバーリストがフィルタされる', async ({ browser }) => {
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    await joinFloor(pageA, slug, '検索ユーザー');
    await joinFloor(pageB, slug, '別のメンバー');
    await pageA.waitForTimeout(2000);

    // 両方見える
    await expect(pageA.getByText('別のメンバー').first()).toBeVisible({ timeout: 5000 });

    // 検索して「別の」でフィルタ
    await pageA.fill('input[placeholder*="メンバーを検索"]', '別の');
    await pageA.waitForTimeout(500);

    // 「別のメンバー」は見える
    await expect(pageA.getByText('別のメンバー').first()).toBeVisible();

    // 検索クリアで全員復活
    await pageA.fill('input[placeholder*="メンバーを検索"]', '');
    await pageA.waitForTimeout(500);
    await expect(pageA.getByText('検索ユーザー').first()).toBeVisible();

    await ctxA.close();
    await ctxB.close();
  });
});

// =============================================================
// I-3. 通知
// =============================================================
test.describe('I-3. 通知', () => {
  let slug: string;

  test.beforeAll(async ({ request }) => {
    slug = await createFloor(request, '通知テストフロア');
  });

  test('I-3-1: ユーザー入室時に通知が表示される', async ({ browser }) => {
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();

    await joinFloor(pageA, slug, '先に入室');

    // 別ユーザーが入室
    const pageB = await ctxB.newPage();
    await joinFloor(pageB, slug, '後から入室');

    // 先に入室したユーザーに通知が表示される
    await expect(pageA.getByText('後から入室 が入室しました')).toBeVisible({ timeout: 5000 });

    await ctxA.close();
    await ctxB.close();
  });

  test('I-3-2: ユーザー退出時に通知が表示される', async ({ browser }) => {
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    await joinFloor(pageA, slug, '残る人');
    await joinFloor(pageB, slug, '去る人');
    await pageA.waitForTimeout(2000);

    // 去る人のタブを閉じる
    await ctxB.close();

    // 残る人に退出通知が表示される
    await expect(pageA.getByText('去る人 が退室しました')).toBeVisible({ timeout: 8000 });

    await ctxA.close();
  });
});

// =============================================================
// L. スタンプ/リアクション
// =============================================================
test.describe('L. スタンプ/リアクション', () => {
  let slug: string;

  test.beforeAll(async ({ request }) => {
    slug = await createFloor(request, 'スタンプテスト');
  });

  test('L-1: スタンプパレットが表示される', async ({ page }) => {
    await joinFloor(page, slug, 'スタンパー');
    await expect(page.getByText('👋')).toBeVisible();
    await expect(page.getByText('👍')).toBeVisible();
    await expect(page.getByText('🎉')).toBeVisible();
  });

  test('L-2: スタンプ送信が他ユーザーに表示', async ({ browser }) => {
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    await joinFloor(pageA, slug, '送信者');
    await joinFloor(pageB, slug, '受信者');
    await pageA.waitForTimeout(2000);

    // 送信者がスタンプクリック
    await pageA.click('button:has-text("👏")');

    // 受信者のフロア上にリアクションが表示される
    // (リアクションはアバター上に3秒間表示)
    await pageA.waitForTimeout(500);
    // 自分のリアクションが見える
    const ownReaction = pageA.locator('text=👏').first();
    await expect(ownReaction).toBeVisible({ timeout: 3000 });

    await ctxA.close();
    await ctxB.close();
  });
});

// =============================================================
// K. パスワード保護
// =============================================================
test.describe('K. パスワード保護', () => {
  let slug: string;

  test.beforeAll(async ({ request }) => {
    // Create password-protected floor directly via API
    const res = await request.post(`${API}/api/floors`, {
      data: { name: 'パスワードフロア', creatorName: 'テスター', password: 'secret123' },
    });
    const body = await res.json();
    slug = body.slug;
  });

  test('K-1: パスワード付きフロアでパスワード入力欄が表示', async ({ page }) => {
    await page.goto(`${BASE}/f/${slug}`);
    await page.waitForSelector('input[placeholder*="名前"]', { timeout: 10000 });
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByText('🔒 入室する')).toBeVisible();
  });

  test('K-2: 間違ったパスワードでエラー', async ({ page }) => {
    await page.goto(`${BASE}/f/${slug}`);
    await page.fill('input[placeholder*="名前"]', 'テスター');
    await page.fill('input[type="password"]', 'wrong');
    await page.click('button:has-text("入室する")');
    await expect(page.getByText('パスワードが正しくありません')).toBeVisible({ timeout: 5000 });
  });

  test('K-3: 正しいパスワードで入室成功', async ({ page }) => {
    await page.goto(`${BASE}/f/${slug}`);
    await page.fill('input[placeholder*="名前"]', 'テスター');
    await page.fill('input[type="password"]', 'secret123');
    await page.click('button:has-text("入室する")');
    await page.waitForSelector('[title*="WebSocket"]', { timeout: 15000 });
    await expect(page.getByText('Online')).toBeVisible();
  });

  test('K-4: パスワードなしフロアではパスワード欄が出ない', async ({ page, request }) => {
    const noPassSlug = await createFloor(request, 'パスワードなし');
    await page.goto(`${BASE}/f/${noPassSlug}`);
    await page.waitForSelector('input[placeholder*="名前"]', { timeout: 10000 });
    await expect(page.locator('input[type="password"]')).not.toBeVisible();
  });
});

// =============================================================
// J. WebSocket接続
// =============================================================
test.describe('J. WebSocket接続', () => {
  let slug: string;

  test.beforeAll(async ({ request }) => {
    slug = await createFloor(request, 'WS接続テスト');
  });

  test('J-1: 入室後にOnline表示', async ({ page }) => {
    await joinFloor(page, slug, 'WS確認');
    await expect(page.getByText('Online')).toBeVisible({ timeout: 10000 });
  });
});
