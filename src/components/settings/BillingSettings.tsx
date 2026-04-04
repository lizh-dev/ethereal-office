'use client';

import { useState, useEffect, useCallback } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import { CreditCard, ExternalLink, RefreshCw, AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface SubscriptionInfo {
  plan: string;
  status: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  email?: string;
}

function getSlug() {
  if (typeof window === 'undefined') return '';
  return window.location.pathname.split('/f/')[1]?.split('/')[0] || '';
}

function getOwnerHeaders(): Record<string, string> {
  const slug = getSlug();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const ownerPw = sessionStorage.getItem(`ethereal-owner-pw-${slug}`);
  if (ownerPw) {
    headers['X-Owner-Password'] = ownerPw;
  } else {
    const tokens = JSON.parse(localStorage.getItem('ethereal-edit-tokens') || '{}');
    if (tokens[slug]) {
      headers['X-Edit-Token'] = tokens[slug];
    }
  }
  return headers;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; bg: string; border: string; Icon: typeof CheckCircle2 }> = {
    active: { label: '有効', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', Icon: CheckCircle2 },
    trialing: { label: 'トライアル中', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd', Icon: Clock },
    canceled: { label: 'キャンセル済み', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', Icon: XCircle },
    past_due: { label: '支払い遅延', color: '#d97706', bg: '#fffbeb', border: '#fde68a', Icon: AlertCircle },
    none: { label: 'なし', color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', Icon: AlertCircle },
  };
  const c = config[status] || config.none;
  const Icon = c.Icon;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
      color: c.color, background: c.bg, border: `1px solid ${c.border}`,
    }}>
      <Icon style={{ width: 14, height: 14 }} />
      {c.label}
    </span>
  );
}

export default function BillingSettings() {
  const floorSlug = useOfficeStore(s => s.floorSlug);
  const floorPlanType = useOfficeStore(s => s.floorPlanType);
  const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState('');

  const slug = floorSlug || getSlug();

  const fetchSubscription = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/floors/${slug}/subscription`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setSubInfo(data);
    } catch {
      setError('サブスクリプション情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const handleOpenPortal = async () => {
    if (!slug) return;
    setPortalLoading(true);
    try {
      const headers = getOwnerHeaders();
      const res = await fetch('/api/payments/portal', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          floorSlug: slug,
          returnUrl: window.location.href,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.open(data.url, '_blank');
      } else {
        setError(data.error || 'ポータルの作成に失敗しました');
      }
    } catch {
      setError('ポータルの作成に失敗しました');
    } finally {
      setPortalLoading(false);
    }
  };

  const isPro = floorPlanType === 'pro';
  const isActive = subInfo?.status === 'active' || subInfo?.status === 'trialing';

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
      {/* Header */}
      <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4">
        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
          <CreditCard className="w-4 h-4" strokeWidth={1.8} /> 請求管理
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-md mx-auto space-y-5">

          {/* Loading state */}
          {loading && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 40, color: '#9ca3af',
            }}>
              <RefreshCw style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} />
              <span style={{ marginLeft: 8, fontSize: 13 }}>読み込み中...</span>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 16px', borderRadius: 12, fontSize: 13,
              background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
            }}>
              <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* Subscription info */}
          {!loading && subInfo && (
            <>
              {/* Plan card */}
              <div style={{
                background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb',
                padding: 20, display: 'flex', flexDirection: 'column', gap: 16,
              }}>
                {/* Plan header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                      現在のプラン
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontSize: 20, fontWeight: 700,
                        color: isPro ? '#059669' : '#6b7280',
                      }}>
                        {isPro ? 'Pro' : 'Free'}
                      </span>
                      <StatusBadge status={subInfo.status} />
                    </div>
                  </div>
                  <button
                    onClick={fetchSubscription}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#9ca3af', padding: 4,
                    }}
                    title="更新"
                  >
                    <RefreshCw style={{ width: 16, height: 16 }} />
                  </button>
                </div>

                {/* Details grid */}
                {isActive && (
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
                  }}>
                    <div style={{
                      background: '#f9fafb', borderRadius: 10, padding: '10px 12px',
                    }}>
                      <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, marginBottom: 2 }}>
                        契約開始日
                      </div>
                      <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
                        {formatDate(subInfo.currentPeriodStart)}
                      </div>
                    </div>
                    <div style={{
                      background: '#f9fafb', borderRadius: 10, padding: '10px 12px',
                    }}>
                      <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, marginBottom: 2 }}>
                        次回更新日
                      </div>
                      <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
                        {formatDate(subInfo.currentPeriodEnd)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Auto-renewal status */}
                {isActive && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 12px', borderRadius: 10,
                    background: subInfo.cancelAtPeriodEnd ? '#fffbeb' : '#f0fdf4',
                    border: `1px solid ${subInfo.cancelAtPeriodEnd ? '#fde68a' : '#bbf7d0'}`,
                  }}>
                    {subInfo.cancelAtPeriodEnd ? (
                      <>
                        <AlertCircle style={{ width: 16, height: 16, color: '#d97706', flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: '#92400e' }}>
                          自動更新: <strong>オフ</strong> -- {formatDate(subInfo.currentPeriodEnd)} に契約終了予定
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 style={{ width: 16, height: 16, color: '#16a34a', flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: '#166534' }}>
                          自動更新: <strong>オン</strong> -- {formatDate(subInfo.currentPeriodEnd)} に自動更新
                        </span>
                      </>
                    )}
                  </div>
                )}

                {/* Email */}
                {subInfo.email && (
                  <div style={{
                    fontSize: 12, color: '#6b7280',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <span>請求先メール:</span>
                    <span style={{ fontWeight: 500, color: '#374151' }}>{subInfo.email}</span>
                  </div>
                )}

                {/* Canceled info */}
                {subInfo.status === 'canceled' && (
                  <div style={{
                    padding: '12px 16px', borderRadius: 10,
                    background: '#fef2f2', border: '1px solid #fecaca',
                    fontSize: 12, color: '#991b1b',
                  }}>
                    サブスクリプションはキャンセルされました。再度ご利用いただくにはアップグレードしてください。
                  </div>
                )}

                {/* Past due info */}
                {subInfo.status === 'past_due' && (
                  <div style={{
                    padding: '12px 16px', borderRadius: 10,
                    background: '#fffbeb', border: '1px solid #fde68a',
                    fontSize: 12, color: '#92400e',
                  }}>
                    お支払いが遅延しています。下のボタンからお支払い方法を更新してください。
                  </div>
                )}
              </div>

              {/* Actions */}
              {isActive && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button
                    onClick={handleOpenPortal}
                    disabled={portalLoading}
                    style={{
                      width: '100%', padding: '12px 0', borderRadius: 12, border: 'none',
                      background: portalLoading ? '#9ca3af' : '#4f46e5',
                      color: '#fff', fontSize: 13, fontWeight: 600,
                      cursor: portalLoading ? 'default' : 'pointer',
                      transition: 'background 0.15s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                  >
                    {portalLoading ? (
                      <>
                        <RefreshCw style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                        読み込み中...
                      </>
                    ) : (
                      <>
                        <ExternalLink style={{ width: 14, height: 14 }} />
                        請求情報を管理
                      </>
                    )}
                  </button>
                  <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>
                    Stripeの請求ポータルでお支払い方法の変更、請求書の確認、プランの変更ができます
                  </p>
                </div>
              )}

              {/* Past due - portal button */}
              {subInfo.status === 'past_due' && (
                <button
                  onClick={handleOpenPortal}
                  disabled={portalLoading}
                  style={{
                    width: '100%', padding: '12px 0', borderRadius: 12, border: 'none',
                    background: portalLoading ? '#9ca3af' : '#d97706',
                    color: '#fff', fontSize: 13, fontWeight: 600,
                    cursor: portalLoading ? 'default' : 'pointer',
                    transition: 'background 0.15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  {portalLoading ? (
                    <>
                      <RefreshCw style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                      読み込み中...
                    </>
                  ) : (
                    <>
                      <ExternalLink style={{ width: 14, height: 14 }} />
                      お支払い方法を更新
                    </>
                  )}
                </button>
              )}

              {/* Free plan info */}
              {subInfo.status === 'none' && (
                <div style={{
                  background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb',
                  padding: 20, textAlign: 'center',
                }}>
                  <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
                    現在 Free プランをご利用中です
                  </div>
                  <a
                    href={`/f/${slug}/upgrade`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '10px 24px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                      background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                      color: 'white', textDecoration: 'none',
                      transition: 'opacity 0.15s',
                    }}
                  >
                    Pro にアップグレード
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
