'use client';

import { useState, useEffect, use } from 'react';
import { CreditCard, Check, ArrowLeft, Zap } from 'lucide-react';

interface SubStatus {
  plan: string;
  status: string;
  currentPeriodEnd?: string;
  email?: string;
}

export default function UpgradePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [sub, setSub] = useState<SubStatus | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState('');

  // Check for checkout success — verify with server to activate subscription
  const [success, setSuccess] = useState(false);
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    if (sessionId) {
      fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.status === 'activated' || data.status === 'already_active') {
            setSuccess(true);
          }
        })
        .catch(() => {
          setSuccess(true); // Show success UI even if verify fails (webhook may handle it)
        });
    }
  }, []);

  useEffect(() => {
    fetch(`/api/floors/${slug}/subscription`)
      .then(r => r.json())
      .then(setSub)
      .finally(() => setLoading(false));
  }, [slug]);

  const handleUpgrade = async () => {
    if (!email) {
      setError('メールアドレスを入力してください');
      return;
    }
    setError('');
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          floorSlug: slug,
          email,
          plan: 'pro',
          successUrl: `${window.location.origin}/f/${slug}/upgrade`,
          cancelUrl: `${window.location.origin}/f/${slug}/upgrade`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'エラーが発生しました');
        return;
      }
      window.location.href = data.sessionUrl;
    } catch {
      setError('通信エラーが発生しました');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleManage = async () => {
    try {
      const res = await fetch('/api/payments/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          floorSlug: slug,
          returnUrl: `${window.location.origin}/f/${slug}/upgrade`,
        }),
      });
      const data = await res.json();
      if (res.ok) window.location.href = data.url;
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <span style={{ color: '#94a3b8' }}>読み込み中...</span>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdf4' }}>
        <div style={{ background: 'white', borderRadius: 20, padding: 48, textAlign: 'center', maxWidth: 420, boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
          <div style={{ width: 64, height: 64, background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Check size={32} style={{ color: '#16a34a' }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>アップグレード完了!</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
            Proプランへのアップグレードが完了しました。<br />
            すべてのPro機能をご利用いただけます。
          </p>
          <a href={`/f/${slug}`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 24px', borderRadius: 12, background: '#0ea5e9', color: 'white',
            textDecoration: 'none', fontWeight: 600, fontSize: 14,
          }}>
            <ArrowLeft size={16} />
            フロアに戻る
          </a>
        </div>
      </div>
    );
  }

  const isActive = sub && (sub.status === 'active' || sub.status === 'trialing');

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 16px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <a href={`/f/${slug}`} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, color: '#64748b',
          textDecoration: 'none', fontSize: 13, marginBottom: 24,
        }}>
          <ArrowLeft size={14} />
          フロアに戻る
        </a>

        {isActive ? (
          <div style={{ background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, background: '#dbeafe', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={20} style={{ color: '#2563eb' }} />
              </div>
              <div>
                <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Proプラン利用中</h1>
                <p style={{ fontSize: 12, color: '#64748b' }}>
                  次回更新: {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString('ja-JP') : '-'}
                </p>
              </div>
            </div>
            <button onClick={handleManage} style={{
              padding: '10px 20px', borderRadius: 10, border: '1px solid #e2e8f0',
              background: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#475569',
            }}>
              サブスクリプション管理
            </button>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={24} style={{ color: 'white' }} />
              </div>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Proにアップグレード</h1>
                <p style={{ fontSize: 13, color: '#64748b' }}>このフロアのPro機能を解放</p>
              </div>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20, marginBottom: 24 }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
                ¥980<span style={{ fontSize: 14, fontWeight: 400, color: '#64748b' }}>/月</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0', display: 'grid', gap: 10 }}>
                {[
                  '同時接続 無制限',
                  '音声・ビデオ通話',
                  '画面共有',
                  'ファイル共有',
                  '共有ホワイトボード',
                  'フロアテンプレート',
                  'メンバー管理',
                  'カスタムブランディング',
                  'SSO対応',
                  'APIアクセス',
                  '優先サポート・SLA保証',
                ].map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}>
                    <Check size={14} style={{ color: '#0ea5e9', flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#64748b', marginBottom: 6 }}>
                メールアドレス（請求先）
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}

            <button
              onClick={handleUpgrade}
              disabled={checkoutLoading}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
                background: checkoutLoading ? '#94a3b8' : 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                color: 'white', fontSize: 15, fontWeight: 700, cursor: checkoutLoading ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <CreditCard size={18} />
              {checkoutLoading ? '処理中...' : 'Proプランに申し込む'}
            </button>

            <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 12 }}>
              Stripeによる安全な決済。いつでもキャンセル可能。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
