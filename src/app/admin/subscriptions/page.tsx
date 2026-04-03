'use client';

import { useEffect, useState } from 'react';

interface Sub {
  id: string;
  floorId: string;
  email: string;
  plan: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  canceledAt: string | null;
  createdAt: string;
  floor?: { name: string; slug: string };
}

function getAdminSecret(): string {
  return sessionStorage.getItem('admin-secret') || '';
}

export default function AdminSubscriptions() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchSubs = (p: number, status: string) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: '20' });
    if (status) params.set('status', status);
    fetch(`/api/admin/subscriptions?${params}`, {
      headers: { 'X-Admin-Secret': getAdminSecret() },
    })
      .then(r => r.json())
      .then(data => {
        setSubs(data.subscriptions || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSubs(page, statusFilter); }, [page, statusFilter]);

  const formatDate = (d: string) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('ja-JP', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'active': return { bg: '#dcfce7', color: '#16a34a' };
      case 'canceled': return { bg: '#fee2e2', color: '#dc2626' };
      case 'past_due': return { bg: '#fef3c7', color: '#d97706' };
      case 'trialing': return { bg: '#dbeafe', color: '#2563eb' };
      default: return { bg: '#f1f5f9', color: '#64748b' };
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>サブスクリプション</h1>
        <span style={{ color: '#64748b', fontSize: 13 }}>全{total}件</span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['', 'active', 'canceled', 'past_due'].map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer',
              border: statusFilter === s ? '1px solid #0ea5e9' : '1px solid #e2e8f0',
              background: statusFilter === s ? '#e0f2fe' : 'white',
              color: statusFilter === s ? '#0369a1' : '#64748b',
            }}>
            {s === '' ? 'すべて' : s === 'active' ? 'Active' : s === 'canceled' ? 'Canceled' : 'Past Due'}
          </button>
        ))}
      </div>

      <div style={{
        background: 'white', borderRadius: 12, overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>フロア</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>メール</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>プラン</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>ステータス</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>次回更新</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>開始日</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>読み込み中...</td></tr>
            ) : subs.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>サブスクリプションがありません</td></tr>
            ) : subs.map(sub => {
              const sc = statusColor(sub.status);
              return (
                <tr key={sub.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500, color: '#0f172a' }}>
                    {sub.floor?.name || '-'}
                    {sub.floor?.slug && (
                      <span style={{ color: '#94a3b8', fontSize: 11, marginLeft: 6, fontFamily: 'monospace' }}>
                        /{sub.floor.slug}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>{sub.email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                      background: '#dbeafe',
                      color: '#2563eb',
                    }}>
                      {sub.plan}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                      background: sc.bg, color: sc.color,
                    }}>
                      {sub.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 12 }}>{formatDate(sub.currentPeriodEnd)}</td>
                  <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 12 }}>{formatDate(sub.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', fontSize: 13, cursor: page <= 1 ? 'default' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}>
            前へ
          </button>
          <span style={{ padding: '6px 14px', fontSize: 13, color: '#64748b' }}>{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
            style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', fontSize: 13, cursor: page >= totalPages ? 'default' : 'pointer', opacity: page >= totalPages ? 0.5 : 1 }}>
            次へ
          </button>
        </div>
      )}
    </div>
  );
}
