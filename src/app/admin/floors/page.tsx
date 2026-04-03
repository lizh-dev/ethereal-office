'use client';

import { useEffect, useState } from 'react';
import { Search, Trash2, ExternalLink } from 'lucide-react';

interface FloorItem {
  id: string;
  slug: string;
  name: string;
  creatorName: string | null;
  hasPassword: boolean;
  hasOwnerPassword: boolean;
  lastActiveAt: string;
  createdAt: string;
  plan: string;
}

function getAdminSecret(): string {
  return sessionStorage.getItem('admin-secret') || '';
}

export default function AdminFloors() {
  const [floors, setFloors] = useState<FloorItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchFloors = (p: number, q: string) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: '20' });
    if (q) params.set('search', q);
    fetch(`/api/admin/floors?${params}`, {
      headers: { 'X-Admin-Secret': getAdminSecret() },
    })
      .then(r => r.json())
      .then(data => {
        setFloors(data.floors || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchFloors(page, search); }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchFloors(1, search);
  };

  const handleDelete = async (slug: string, name: string) => {
    if (!confirm(`フロア「${name}」を削除しますか？`)) return;
    await fetch(`/api/admin/floors/${slug}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Secret': getAdminSecret() },
    });
    fetchFloors(page, search);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>フロア管理</h1>
        <span style={{ color: '#64748b', fontSize: 13 }}>全{total}件</span>
      </div>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="名前またはSlugで検索..."
            style={{
              width: '100%', padding: '8px 12px 8px 36px', borderRadius: 8,
              border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <button type="submit" style={{
          padding: '8px 16px', borderRadius: 8, border: 'none',
          background: '#0ea5e9', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          検索
        </button>
      </form>

      <div style={{
        background: 'white', borderRadius: 12, overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>名前</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>Slug</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>作成者</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>プラン</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>最終アクティブ</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>作成日</th>
              <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600, color: '#64748b' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>読み込み中...</td></tr>
            ) : floors.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>フロアがありません</td></tr>
            ) : floors.map(f => (
              <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 16px', fontWeight: 500, color: '#0f172a' }}>{f.name}</td>
                <td style={{ padding: '12px 16px', color: '#64748b', fontFamily: 'monospace' }}>{f.slug}</td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{f.creatorName || '-'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                    background: f.plan === 'pro' ? '#dbeafe' : '#f1f5f9',
                    color: f.plan === 'pro' ? '#2563eb' : '#64748b',
                  }}>
                    {f.plan}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 12 }}>{formatDate(f.lastActiveAt)}</td>
                <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 12 }}>{formatDate(f.createdAt)}</td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <a href={`/f/${f.slug}`} target="_blank" rel="noopener noreferrer"
                      style={{ color: '#0ea5e9', cursor: 'pointer' }}>
                      <ExternalLink size={16} />
                    </a>
                    <button onClick={() => handleDelete(f.slug, f.name)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
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
