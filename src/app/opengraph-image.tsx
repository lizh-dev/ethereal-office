import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const alt = 'SmartOffice - チームの距離を、ゼロにする';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #f0f9ff 0%, #f8fafc 40%, #f8fafc 100%)',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 24px',
            borderRadius: 999,
            background: 'white',
            border: '1px solid #bae6fd',
            fontSize: 18,
            color: '#0284c7',
            marginBottom: 36,
          }}
        >
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#4ade80' }} />
          無料で使えるバーチャルオフィス
        </div>

        {/* Main heading line 1 */}
        <div
          style={{
            fontSize: 76,
            fontWeight: 800,
            color: '#111827',
            lineHeight: 1.15,
            textAlign: 'center',
            letterSpacing: '-0.02em',
          }}
        >
          チームの距離を、
        </div>

        {/* Main heading line 2 - gradient */}
        <div
          style={{
            fontSize: 76,
            fontWeight: 800,
            lineHeight: 1.15,
            textAlign: 'center',
            letterSpacing: '-0.02em',
            marginBottom: 28,
            color: '#3b82f6',
          }}
        >
          ゼロにする。
        </div>

        {/* Sub text */}
        <div
          style={{
            fontSize: 26,
            color: '#6b7280',
            textAlign: 'center',
            marginBottom: 48,
          }}
        >
          アカウント登録は不要です。URLを共有するだけ。
        </div>

        {/* Key numbers row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 48,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 30, fontWeight: 700, color: '#111827' }}>30秒</span>
            <span style={{ fontSize: 15, color: '#9ca3af', marginTop: 4 }}>でオフィス開設</span>
          </div>
          <div style={{ width: 1, height: 44, background: '#d1d5db' }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 30, fontWeight: 700, color: '#111827' }}>0円</span>
            <span style={{ fontSize: 15, color: '#9ca3af', marginTop: 4 }}>主要機能すべて無料</span>
          </div>
          <div style={{ width: 1, height: 44, background: '#d1d5db' }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 30, fontWeight: 700, color: '#111827' }}>登録不要</span>
            <span style={{ fontSize: 15, color: '#9ca3af', marginTop: 4 }}>URL共有のみ</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
