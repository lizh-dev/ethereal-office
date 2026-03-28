# The Ethereal Office - バーチャルオフィス

oViceを超えるバーチャルオフィスプラットフォーム。

## 起動方法

### 1. 依存パッケージインストール
```bash
npm install --legacy-peer-deps
```

### 2. WebSocketサーバー起動（リアルタイム通信用）
```bash
npx tsx src/server/ws.ts
```
ポート3001で待受。

### 3. Next.js開発サーバー起動
```bash
npm run dev
```
http://localhost:3000 でアクセス。

### マルチユーザーテスト
複数のブラウザタブで http://localhost:3000 を開くと、各タブが独立したユーザーとしてWSサーバーに接続。

## 機能一覧

### フロアエディター（編集モード）
- Excalidrawベース: 選択/ドラッグ/リサイズ/回転/Undo/Redo/グループ化
- スペースウィザード: 行数×列数+間隔でデスクエリア/会議室/ラウンジ/カフェを自動生成
- 家具ライブラリ: 11種類のプリセット家具
- JSON エクスポート/インポート
- localStorage永続化

### バーチャルオフィス（ビューモード）
- フロアプラン表示（Excalidraw viewMode）
- DiceBearアバター（スタイル/シード選択可能）
- 椅子クリック着席/立ち上がる(Esc)
- チャット（吹き出し表示）
- 近接検知ライン
- ステータス管理（オンライン/ビジー/集中/離席）
- アクションバー（ミュート/カメラ/画面共有UI）
- ホバーツールチップ

### バックエンド
- WebSocketサーバー: リアルタイムユーザー同期
- API Route: フロアプラン保存/読み込み

## 技術スタック
- Next.js 15 (App Router) + TypeScript
- Excalidraw + Zustand + Tailwind CSS
- WebSocket (ws) + DiceBear
