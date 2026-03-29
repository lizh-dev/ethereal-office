# 商用環境デプロイ案

## 現在のローカル構成

```
docker-compose.yml
├── db (PostgreSQL 16)         → port 56322
├── api (Go + GORM + WS)      → port 8080
└── Next.js (npm run dev)     → port 3000
```

---

## 案A: VPS一台（最安・推奨）

**月額: $5〜12**

```
VPS (Hetzner CAX11 $4/月 or DigitalOcean $6/月)
├── Caddy (リバースプロキシ + 自動SSL)
├── Docker Compose
│   ├── db (PostgreSQL 16)
│   ├── api (Go binary)
│   └── next (Next.js standalone build)
└── systemd (自動起動)
```

**手順:**
1. VPS契約 (Hetzner/DigitalOcean/Vultr)
2. Docker + Docker Compose インストール
3. Caddy インストール（自動SSL対応）
4. `docker compose -f docker-compose.prod.yml up -d`
5. DNS設定 (A レコード → VPS IP)

**Caddyfile例:**
```
yourdomain.com {
    reverse_proxy /api/* localhost:8080
    reverse_proxy /ws localhost:8080
    reverse_proxy /* localhost:3000
}
```

**メリット:** 安い。一箇所管理。Go+PostgreSQLは軽量で$5 VPSで十分。
**デメリット:** サーバー管理（パッチ、バックアップ）が必要。

---

## 案B: Fly.io + Supabase

**月額: $0〜10**

```
Fly.io
├── Go API + WS (Fly Machine)
└── Next.js (Fly Machine or Vercel)

Supabase Cloud (無料枠)
└── PostgreSQL
```

**手順:**
1. Fly.ioアカウント作成
2. `fly launch` でGo APIデプロイ
3. Supabase CloudでDB作成（Tokyo region）
4. Vercel or Fly.ioでNext.jsデプロイ
5. 環境変数設定

**メリット:** ほぼ無料で始められる。マネージドDB。
**デメリット:** Fly.io無料枠の制限（3 shared VMs）。

---

## 案C: Vercel + Railway

**月額: $5〜25**

```
Vercel
└── Next.js (Hobby $0 → Pro $20)

Railway ($5/月〜)
├── Go API + WS
└── PostgreSQL (Railway add-on)
```

**手順:**
1. Railway アカウント作成、GitHubリポ接続
2. Go API + PostgreSQL サービスを作成
3. Vercel にNext.jsデプロイ
4. 環境変数で接続先設定

**メリット:** マネージド。スケーラブル。
**デメリット:** 2サービス管理。Vercel Proが商用には必要。

---

## 本番用docker-compose (案A用)

```yaml
name: ethereal-office-prod

services:
  db:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_DB: ethereal_office
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - prod-db:/var/lib/postgresql/data

  api:
    image: ghcr.io/your-org/ethereal-office-api:latest
    restart: always
    ports:
      - "8080:8080"
    environment:
      DATABASE_URL: "host=db user=${DB_USER} password=${DB_PASSWORD} dbname=ethereal_office port=5432 sslmode=disable"
      WS_ALLOWED_ORIGINS: "https://yourdomain.com"
      PORT: "8080"
    depends_on:
      - db

  next:
    image: ghcr.io/your-org/ethereal-office-web:latest
    restart: always
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://api:8080
      NEXT_PUBLIC_WS_URL: wss://yourdomain.com/ws

volumes:
  prod-db:
```

---

## フェーズ2: 音声/ビデオ追加

ローンチ後に追加検討:
- **LiveKit Cloud** ($0〜従量課金): マネージドWebRTC SFU
- **自前WebRTC**: P2P mesh (小規模向け) or SFU (mediasoup/Pion)
- 近接音声: 距離ベースの音量制御
- 既存UIボタン(ミュート/カメラ/画面共有)を接続
