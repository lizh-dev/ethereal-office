'use client';

import { useState, useEffect } from 'react';
import FeatureGate from '@/components/plan/FeatureGate';

function getSlug() {
  if (typeof window === 'undefined') return '';
  return window.location.pathname.split('/')[2] || '';
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

function SSOSettingsInner() {
  const slug = getSlug();
  const [enabled, setEnabled] = useState(false);
  const [allowedDomain, setAllowedDomain] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/floors/${slug}/sso/config`)
      .then(res => res.json())
      .then(data => {
        setEnabled(data.enabled || false);
        setAllowedDomain(data.allowedDomain || '');
      })
      .catch(() => {});
  }, [slug]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/floors/${slug}/sso/config`, {
        method: 'PUT',
        headers: getOwnerHeaders(),
        body: JSON.stringify({ enabled, allowedDomain }),
      });
      if (!res.ok) {
        const data = await res.json();
        if (data.error === 'upgrade_required') {
          setError('この機能はProプラン以上で利用できます');
        } else {
          setError(data.error || 'SSO設定の保存に失敗しました');
        }
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('SSO設定の保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* SSO enabled toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => setEnabled(!enabled)}
          style={{
            width: 44,
            height: 24,
            borderRadius: 12,
            border: 'none',
            background: enabled ? '#4f46e5' : '#d1d5db',
            cursor: 'pointer',
            position: 'relative',
            transition: 'background 0.2s',
            flexShrink: 0,
          }}
        >
          <div style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            background: '#fff',
            position: 'absolute',
            top: 3,
            left: enabled ? 23 : 3,
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }} />
        </button>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>
            Google SSOを有効にする
          </div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
            フロアに入室する前にGoogleサインインを要求します
          </div>
        </div>
      </div>

      {/* Allowed domain */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
          許可するドメイン（任意）
        </label>
        <input
          type="text"
          value={allowedDomain}
          onChange={e => setAllowedDomain(e.target.value)}
          placeholder="例: company.com"
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            fontSize: 13,
            color: '#1f2937',
            outline: 'none',
            background: '#fff',
          }}
        />
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
          空欄の場合、すべてのGoogleアカウントでサインインできます
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: '8px 12px',
          fontSize: 12,
          color: '#dc2626',
          background: '#fef2f2',
          borderRadius: 8,
        }}>
          {error}
        </div>
      )}

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: '100%',
          padding: '10px 0',
          borderRadius: 10,
          border: 'none',
          background: saving ? '#9ca3af' : '#4f46e5',
          color: '#fff',
          fontSize: 13,
          fontWeight: 600,
          cursor: saving ? 'default' : 'pointer',
          transition: 'background 0.15s',
        }}
      >
        {saved ? '✓ 保存しました' : saving ? '保存中...' : '保存'}
      </button>
    </div>
  );
}

export default function SSOSettings() {
  return (
    <FeatureGate feature="sso">
      <SSOSettingsInner />
    </FeatureGate>
  );
}
