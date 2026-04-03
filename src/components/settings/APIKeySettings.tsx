'use client';

import { useState, useEffect, useCallback } from 'react';
import FeatureGate from '@/components/plan/FeatureGate';

interface APIKeyRecord {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt?: string;
  revokedAt?: string;
  createdAt: string;
}

function getSlug() {
  if (typeof window === 'undefined') return '';
  return window.location.pathname.split('/')[2] || '';
}

function getOwnerPassword(slug: string) {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('ethereal-owner-pw-' + slug) || '';
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function APIKeySettings() {
  return (
    <FeatureGate feature="apiAccess">
      <APIKeySettingsInner />
    </FeatureGate>
  );
}

function APIKeySettingsInner() {
  const slug = getSlug();
  const [keys, setKeys] = useState<APIKeyRecord[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchKeys = useCallback(async () => {
    if (!slug) return;
    try {
      const res = await fetch(`${API_BASE}/api/floors/${slug}/api-keys`, {
        headers: { 'X-Owner-Password': getOwnerPassword(slug) },
      });
      if (res.ok) {
        const data = await res.json();
        setKeys(data);
      }
    } catch {
      // ignore fetch errors
    }
  }, [slug]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    setLoading(true);
    setError(null);
    setGeneratedKey(null);
    try {
      const res = await fetch(`${API_BASE}/api/floors/${slug}/api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Owner-Password': getOwnerPassword(slug),
        },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'APIキーの生成に失敗しました');
        return;
      }
      const data = await res.json();
      setGeneratedKey(data.key);
      setNewKeyName('');
      fetchKeys();
    } catch {
      setError('APIキーの生成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (keyId: string) => {
    if (!confirm('このAPIキーを無効化しますか？')) return;
    try {
      const res = await fetch(`${API_BASE}/api/floors/${slug}/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: { 'X-Owner-Password': getOwnerPassword(slug) },
      });
      if (res.ok) {
        fetchKeys();
      }
    } catch {
      // ignore
    }
  };

  const handleCopy = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{ marginTop: 32 }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>
        APIキー管理
      </h3>
      <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
        外部サービスからフロア情報にアクセスするためのAPIキーを管理します。
      </p>

      {/* Generate new key */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          type="text"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          placeholder="キーの名前（例: Slack Bot）"
          style={{
            flex: 1, padding: '8px 12px', fontSize: 13,
            border: '1px solid #e2e8f0', borderRadius: 8,
            outline: 'none', color: '#0f172a',
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        />
        <button
          onClick={handleCreate}
          disabled={loading || !newKeyName.trim()}
          style={{
            padding: '8px 16px', fontSize: 12, fontWeight: 600,
            borderRadius: 8, border: 'none', cursor: 'pointer',
            background: !newKeyName.trim() || loading ? '#cbd5e1' : 'linear-gradient(135deg, #0ea5e9, #6366f1)',
            color: 'white',
          }}
        >
          {loading ? '生成中...' : 'APIキーを生成'}
        </button>
      </div>

      {error && (
        <div style={{
          padding: '8px 12px', fontSize: 12, color: '#dc2626',
          background: '#fef2f2', borderRadius: 8, marginBottom: 12,
        }}>
          {error}
        </div>
      )}

      {/* Newly generated key */}
      {generatedKey && (
        <div style={{
          padding: 12, background: '#fefce8', border: '1px solid #fde68a',
          borderRadius: 8, marginBottom: 16,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#92400e', marginBottom: 8 }}>
            このキーは一度だけ表示されます
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <code style={{
              flex: 1, padding: '8px 10px', fontSize: 12, fontFamily: 'monospace',
              background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6,
              wordBreak: 'break-all', color: '#0f172a',
            }}>
              {generatedKey}
            </code>
            <button
              onClick={handleCopy}
              style={{
                padding: '6px 12px', fontSize: 11, fontWeight: 600,
                borderRadius: 6, border: '1px solid #e2e8f0', cursor: 'pointer',
                background: copied ? '#d1fae5' : '#f8fafc',
                color: copied ? '#065f46' : '#475569',
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {/* Existing keys table */}
      {keys.length > 0 && (
        <div style={{
          border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>名前</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>キー</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>作成日</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>最終使用</th>
                <th style={{ padding: '8px 12px' }}></th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} style={{
                  borderTop: '1px solid #e2e8f0',
                  opacity: k.revokedAt ? 0.5 : 1,
                }}>
                  <td style={{ padding: '8px 12px', color: '#0f172a' }}>{k.name}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <code style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748b' }}>
                      {k.keyPrefix}
                    </code>
                  </td>
                  <td style={{ padding: '8px 12px', color: '#64748b' }}>
                    {new Date(k.createdAt).toLocaleDateString('ja-JP')}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#64748b' }}>
                    {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString('ja-JP') : '-'}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                    {k.revokedAt ? (
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>無効化済み</span>
                    ) : (
                      <button
                        onClick={() => handleRevoke(k.id)}
                        style={{
                          padding: '4px 10px', fontSize: 11, fontWeight: 600,
                          borderRadius: 6, border: '1px solid #fecaca', cursor: 'pointer',
                          background: '#fff', color: '#dc2626',
                        }}
                      >
                        無効化
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {keys.length === 0 && !generatedKey && (
        <div style={{
          padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 12,
          border: '1px dashed #e2e8f0', borderRadius: 8,
        }}>
          APIキーはまだ作成されていません
        </div>
      )}
    </div>
  );
}
