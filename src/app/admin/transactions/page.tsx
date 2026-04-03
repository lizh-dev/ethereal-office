'use client';

import { useEffect, useState } from 'react';

interface Tx {
  id: string;
  floorId: string | null;
  email: string;
  amount: number;
  currency: string;
  type: string;
  status: string;
  description: string;
  createdAt: string;
  floor?: { name: string; slug: string } | null;
}

function getAdminSecret(): string {
  return sessionStorage.getItem('admin-secret') || '';
}

export default function AdminTransactions() {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchTxs = (p: number) => {
    setLoading(true);
    fetch(`/api/admin/transactions?page=${p}&limit=20`, {
      headers: { 'X-Admin-Secret': getAdminSecret() },
    })
      .then(r => r.json())
      .then(data => {
        setTxs(data.transactions || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTxs(page); }, [page]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const statusColor = (s: string) => {
    switch (s) {
      case 'succeeded': return { bg: '#dcfce7', color: '#16a34a' };
      case 'pending': return { bg: '#fef3c7', color: '#d97706' };
      case 'failed': return { bg: '#fee2e2', color: '#dc2626' };
      case 'refunded': return { bg: '#e0e7ff', color: '#4f46e5' };
      default: return { bg: '#f1f5f9', color: '#64748b' };
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>取引履歴</h1>
        <span style={{ color: '#64748b', fontSize: 13 }}>全{total}件</span>
      </div>

      <div style={{
        background: 'white', borderRadius: 12, overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>日時</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>フロア</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>メール</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>種別</th>
              <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#64748b' }}>金額</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>ステータス</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>説明</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>読み込み中...</td></tr>
            ) : txs.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>取引がありません</td></tr>
            ) : txs.map(tx => {
              const sc = statusColor(tx.status);
              return (
                <tr key={tx.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 12, whiteSpace: 'nowrap' }}>{formatDate(tx.createdAt)}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 500, color: '#0f172a' }}>
                    {tx.floor?.name || '-'}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>{tx.email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                      background: '#f1f5f9', color: '#475569',
                    }}>
                      {tx.type}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#0f172a', fontFamily: 'monospace' }}>
                    ¥{tx.amount.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                      background: sc.bg, color: sc.color,
                    }}>
                      {tx.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tx.description || '-'}
                  </td>
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
