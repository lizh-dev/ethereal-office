'use client';

import { useState, useRef, useEffect } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import FeatureGate from '@/components/plan/FeatureGate';

const PRESET_COLORS = ['#0ea5e9', '#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#ec4899'];

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

function BrandingSettingsInner() {
  const branding = useOfficeStore(s => s.branding);
  const setBranding = useOfficeStore(s => s.setBranding);
  const [logoUrl, setLogoUrl] = useState(branding.logoUrl);
  const [accentColor, setAccentColor] = useState(branding.accentColor || '#0ea5e9');
  const [floorTitle, setFloorTitle] = useState(branding.floorTitle);
  const [accentTargets, setAccentTargets] = useState(branding.accentTargets || { header: false, sidebar: false, buttons: false });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLogoUrl(branding.logoUrl);
    setAccentColor(branding.accentColor || '#0ea5e9');
    setFloorTitle(branding.floorTitle);
    setAccentTargets(branding.accentTargets || { header: false, sidebar: false, buttons: false });
  }, [branding]);

  const slug = getSlug();

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const headers: Record<string, string> = {};
      const ownerPw = sessionStorage.getItem(`ethereal-owner-pw-${slug}`);
      if (ownerPw) {
        headers['X-Owner-Password'] = ownerPw;
      } else {
        const tokens = JSON.parse(localStorage.getItem('ethereal-edit-tokens') || '{}');
        if (tokens[slug]) {
          headers['X-Edit-Token'] = tokens[slug];
        }
      }

      const res = await fetch(`/api/floors/${slug}/branding/logo`, {
        method: 'POST',
        headers,
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setLogoUrl(data.url);
      }
    } catch {
      // ignore
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/floors/${slug}/branding`, {
        method: 'PUT',
        headers: getOwnerHeaders(),
        body: JSON.stringify({ logoUrl, accentColor, floorTitle, accentTargets }),
      });
      if (res.ok) {
        const data = await res.json();
        setBranding({
          logoUrl: data.logoUrl,
          accentColor: data.accentColor,
          floorTitle: data.floorTitle,
          accentTargets: data.accentTargets || { header: false, sidebar: false, buttons: false },
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Logo upload */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
          ロゴ画像
        </label>
        {logoUrl && (
          <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src={logoUrl}
              alt="Logo"
              style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb' }}
            />
            <button
              onClick={() => setLogoUrl('')}
              style={{ fontSize: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              削除
            </button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleLogoUpload}
          style={{ fontSize: 12, color: '#6b7280' }}
        />
        {uploading && <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 8 }}>アップロード中...</span>}
      </div>

      {/* Accent color */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
          アクセントカラー
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              onClick={() => setAccentColor(c)}
              style={{
                width: 32, height: 32, borderRadius: 8, background: c, border: accentColor === c ? '3px solid #1f2937' : '2px solid #e5e7eb',
                cursor: 'pointer', transition: 'border 0.15s',
              }}
              title={c}
            />
          ))}
          <input
            type="color"
            value={accentColor}
            onChange={e => setAccentColor(e.target.value)}
            style={{ width: 32, height: 32, borderRadius: 8, border: '2px solid #e5e7eb', cursor: 'pointer', padding: 0 }}
            title="カスタムカラー"
          />
        </div>
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
          現在: {accentColor}
        </div>

        {/* Accent color targets */}
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#4b5563', marginBottom: 8 }}>
            カラー適用先
          </div>
          {([
            { key: 'header' as const, label: 'ヘッダー背景色' },
            { key: 'sidebar' as const, label: 'サイドバーアクティブ色' },
            { key: 'buttons' as const, label: 'ボタン色（Proバッジ・共有ボタン）' },
          ]).map(item => (
            <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 0' }}>
              <input
                type="checkbox"
                checked={accentTargets[item.key]}
                onChange={e => setAccentTargets(prev => ({ ...prev, [item.key]: e.target.checked }))}
                style={{ width: 16, height: 16, accentColor: accentColor, cursor: 'pointer' }}
              />
              <span style={{ fontSize: 12, color: '#374151' }}>{item.label}</span>
            </label>
          ))}
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
            ONにした箇所にアクセントカラーが適用されます
          </div>
        </div>
      </div>

      {/* Floor title */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
          フロアタイトル（ヘッダー表示名）
        </label>
        <input
          type="text"
          value={floorTitle}
          onChange={e => setFloorTitle(e.target.value)}
          placeholder="SmartOffice"
          style={{
            width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 10,
            fontSize: 13, color: '#1f2937', outline: 'none', background: '#fff',
          }}
        />
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: '100%', padding: '10px 0', borderRadius: 10, border: 'none',
          background: saving ? '#9ca3af' : '#4f46e5', color: '#fff', fontSize: 13, fontWeight: 600,
          cursor: saving ? 'default' : 'pointer', transition: 'background 0.15s',
        }}
      >
        {saved ? '✓ 保存しました' : saving ? '保存中...' : '保存'}
      </button>

      {/* Slug editor */}
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16, marginTop: 8 }}>
        <SlugEditor slug={slug} />
      </div>
    </div>
  );
}

function SlugEditor({ slug }: { slug: string }) {
  const [newSlug, setNewSlug] = useState(slug);
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (val: string) => {
    const cleaned = val.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    setNewSlug(cleaned);
    setSaved(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!cleaned || cleaned.length < 3) {
      setStatus(cleaned ? 'invalid' : 'idle');
      return;
    }
    if (cleaned === slug) { setStatus('idle'); return; }
    setStatus('checking');
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/floors/check-slug?slug=${encodeURIComponent(cleaned)}`);
        const data = await res.json();
        setStatus(data.available ? 'available' : 'taken');
      } catch { setStatus('idle'); }
    }, 400);
  };

  const handleSave = async () => {
    if (status !== 'available' || !newSlug || newSlug === slug) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/floors/${slug}`, {
        method: 'PATCH',
        headers: getOwnerHeaders(),
        body: JSON.stringify({ customSlug: newSlug }),
      });
      if (res.ok) {
        const data = await res.json();
        setSaved(true);
        // Redirect to new slug
        setTimeout(() => { window.location.href = `/f/${data.slug}`; }, 500);
      } else {
        const data = await res.json();
        alert(data.message || 'エラーが発生しました');
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
        フロアID（URL）
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, color: '#9ca3af', flexShrink: 0 }}>/f/</span>
        <input
          type="text"
          value={newSlug}
          onChange={e => handleChange(e.target.value)}
          maxLength={30}
          style={{
            flex: 1, padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 10,
            fontSize: 13, color: '#1f2937', outline: 'none', background: '#fff', fontFamily: 'monospace',
          }}
        />
        {status === 'checking' && <span style={{ fontSize: 11, color: '#9ca3af' }}>確認中...</span>}
        {status === 'available' && <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 600 }}>使用可能</span>}
        {status === 'taken' && <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>使用中</span>}
        {status === 'invalid' && <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>3文字以上</span>}
      </div>
      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>英数字・ハイフン・アンダースコア（3〜30文字）</div>
      {status === 'available' && newSlug !== slug && (
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            marginTop: 8, width: '100%', padding: '10px 0', borderRadius: 10, border: 'none',
            background: saving ? '#9ca3af' : '#4f46e5', color: '#fff', fontSize: 13, fontWeight: 600,
            cursor: saving ? 'default' : 'pointer',
          }}
        >
          {saved ? '✓ 変更しました（リダイレクト中...）' : saving ? '変更中...' : 'IDを変更'}
        </button>
      )}
    </div>
  );
}

export default function BrandingSettings() {
  return (
    <FeatureGate feature="customBranding">
      <BrandingSettingsInner />
    </FeatureGate>
  );
}
