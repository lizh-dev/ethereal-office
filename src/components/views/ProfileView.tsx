'use client';

import { useState, useEffect, useRef } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import { getAvatarUrl } from '@/components/floor/assets';
import { useWsSend } from '@/contexts/WebSocketContext';
import BrandingSettings from '@/components/settings/BrandingSettings';
import { Settings, Check, User, Palette, CreditCard, Upload, X } from 'lucide-react';

const AVATAR_STYLES = ['notionists', 'avataaars', 'big-smile', 'adventurer', 'personas', 'lorelei'];
const AVATAR_SEEDS = ['田中', '佐藤', '鈴木', '高橋', '伊藤', '渡辺', '山本', '中村', '小林', '加藤', '吉田', '山田'];

const MAX_CUSTOM_AVATAR_SIZE = 200 * 1024; // 200KB

type SettingsTab = 'profile' | 'branding' | 'billing';

export default function ProfileView() {
  const { currentUser, setCurrentUserAvatar, setCustomAvatar, isFloorOwner, floorPlanType, floorSlug, planPermissions } = useOfficeStore();
  const wsSend = useWsSend();
  const [name, setName] = useState(currentUser.name);
  const [avatarStyle, setAvatarStyle] = useState(currentUser.avatarStyle || 'notionists');
  const [avatarSeed, setAvatarSeed] = useState(currentUser.avatarSeed || 'default');
  const [customAvatarUrl, setCustomAvatarUrlLocal] = useState(currentUser.customAvatarUrl || '');
  const [useCustomAvatar, setUseCustomAvatar] = useState(!!currentUser.customAvatarUrl);
  const [uploadError, setUploadError] = useState('');
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<SettingsTab>('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPro = floorPlanType === 'pro';
  const canCustomAvatar = !!planPermissions.customAvatar;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('画像ファイルを選択してください');
      return;
    }
    if (file.size > MAX_CUSTOM_AVATAR_SIZE) {
      setUploadError('画像は200KB以下にしてください');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        setCustomAvatarUrlLocal(dataUrl);
        setUseCustomAvatar(true);
      }
    };
    reader.readAsDataURL(file);
    // Reset file input so same file can be re-selected
    e.target.value = '';
  };

  const handleRemoveCustomAvatar = () => {
    setCustomAvatarUrlLocal('');
    setUseCustomAvatar(false);
  };

  const handleSave = () => {
    const finalCustomAvatarUrl = useCustomAvatar ? customAvatarUrl : '';
    useOfficeStore.setState((state) => ({
      currentUser: {
        ...state.currentUser,
        name: name.trim() || state.currentUser.name,
        avatarStyle,
        avatarSeed,
        customAvatarUrl: finalCustomAvatarUrl,
        initials: (name.trim() || state.currentUser.name)[0],
      },
    }));
    setCurrentUserAvatar(avatarStyle, avatarSeed);
    setCustomAvatar(finalCustomAvatarUrl);
    localStorage.setItem('ethereal-office-user', JSON.stringify({
      name: name.trim(),
      avatarStyle,
      avatarSeed,
      customAvatarUrl: finalCustomAvatarUrl,
    }));
    // Save custom avatar separately (can be large for localStorage)
    try {
      if (finalCustomAvatarUrl) {
        localStorage.setItem('ethereal-custom-avatar', finalCustomAvatarUrl);
      } else {
        localStorage.removeItem('ethereal-custom-avatar');
      }
    } catch { /* localStorage quota exceeded — ignored */ }
    wsSend.profileUpdate(name.trim() || currentUser.name, avatarStyle, avatarSeed, finalCustomAvatarUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const previewAvatarUrl = useCustomAvatar && customAvatarUrl
    ? customAvatarUrl
    : getAvatarUrl(avatarSeed, avatarStyle);

  const tabs: { id: SettingsTab; label: string; Icon: typeof User; show: boolean }[] = [
    { id: 'profile', label: 'プロフィール', Icon: User, show: true },
    { id: 'branding', label: '外観', Icon: Palette, show: isPro && isFloorOwner },
    { id: 'billing', label: '請求', Icon: CreditCard, show: isPro && isFloorOwner },
  ];

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
      {/* Header with tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="h-12 flex items-center px-4">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><Settings className="w-4 h-4" strokeWidth={1.8} /> 設定</h2>
        </div>
        <div className="flex px-4 gap-1">
          {tabs.filter(t => t.show).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <t.Icon className="w-3.5 h-3.5" strokeWidth={1.8} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-md mx-auto space-y-6">

          {/* Profile tab */}
          {tab === 'profile' && (
            <>
              {/* Avatar preview */}
              <div className="flex justify-center">
                <img
                  src={previewAvatarUrl}
                  alt="avatar"
                  className="w-24 h-24 rounded-full border-4 border-indigo-100"
                  style={{ objectFit: 'cover' }}
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">表示名</label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-gray-800"
                />
              </div>

              {/* Custom avatar upload — Pro only, hidden for Free */}
              {canCustomAvatar && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">カスタムアバター画像</label>
                  {useCustomAvatar && customAvatarUrl ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={customAvatarUrl}
                        alt="custom"
                        className="w-16 h-16 rounded-full border-2 border-indigo-300"
                        style={{ objectFit: 'cover' }}
                      />
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-indigo-600 font-medium">カスタム画像を使用中</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="text-xs text-gray-500 hover:text-gray-700 underline"
                          >
                            変更
                          </button>
                          <button
                            onClick={handleRemoveCustomAvatar}
                            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-0.5"
                          >
                            <X className="w-3 h-3" /> 削除
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors w-full justify-center"
                    >
                      <Upload className="w-4 h-4" />
                      画像をアップロード
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {uploadError && (
                    <p className="text-xs text-red-500 mt-1">{uploadError}</p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1">200KB以下のJPG/PNG画像</p>
                </div>
              )}

              {/* Avatar style */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">アバタースタイル</label>
                <div className="grid grid-cols-6 gap-2">
                  {AVATAR_STYLES.map((style) => (
                    <button key={style} onClick={() => { setAvatarStyle(style); setUseCustomAvatar(false); }}
                      className={`p-1 rounded-lg border-2 transition-all ${!useCustomAvatar && avatarStyle === style ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:border-gray-300'}`}
                    >
                      <img src={`https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(avatarSeed)}&radius=50`} alt={style} className="w-full rounded" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Avatar seed / character */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">キャラクター</label>
                <div className="grid grid-cols-6 gap-2">
                  {AVATAR_SEEDS.map((seed) => (
                    <button key={seed} onClick={() => { setAvatarSeed(seed); setUseCustomAvatar(false); }}
                      className={`p-1 rounded-lg border-2 transition-all ${!useCustomAvatar && avatarSeed === seed ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:border-gray-300'}`}
                    >
                      <img src={`https://api.dicebear.com/9.x/${avatarStyle}/svg?seed=${encodeURIComponent(seed)}&radius=50`} alt={seed} className="w-full rounded" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Save button */}
              <button onClick={handleSave}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors text-sm"
              >
                {saved ? <span className="flex items-center justify-center gap-1"><Check className="w-4 h-4 inline" strokeWidth={1.8} /> 保存しました</span> : '保存'}
              </button>
            </>
          )}

          {/* Branding tab */}
          {tab === 'branding' && (
            <BrandingSettings />
          )}

          {/* Billing tab */}
          {tab === 'billing' && (
            <BillingTab floorSlug={floorSlug} />
          )}
        </div>
      </div>
    </div>
  );
}

function BillingTab({ floorSlug }: { floorSlug: string }) {
  const [sub, setSub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/floors/${floorSlug}/subscription`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { setSub(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [floorSlug]);

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const ownerPw = sessionStorage.getItem(`ethereal-owner-pw-${floorSlug}`) || '';
      const res = await fetch('/api/payments/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ floorSlug, ownerPassword: ownerPw }),
      });
      const data = await res.json();
      if (data.url) window.open(data.url, '_blank');
    } catch { /* ignore */ }
    setPortalLoading(false);
  };

  if (loading) return <p className="text-sm text-gray-400">読み込み中...</p>;

  const statusLabels: Record<string, string> = {
    active: '有効',
    trialing: 'トライアル中',
    canceled: 'キャンセル済み',
    past_due: '支払い遅延',
  };
  const statusColors: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    trialing: 'bg-blue-50 text-blue-600 border-blue-200',
    canceled: 'bg-gray-50 text-gray-500 border-gray-200',
    past_due: 'bg-red-50 text-red-600 border-red-200',
  };

  return (
    <div className="space-y-6">
      <h3 className="text-base font-semibold text-gray-800">請求・サブスクリプション</h3>

      {sub ? (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">プラン</span>
            <span className="text-sm font-semibold text-gray-800">Pro</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">ステータス</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusColors[sub.status] || 'bg-gray-50 text-gray-500'}`}>
              {statusLabels[sub.status] || sub.status}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">契約期間</span>
            <span className="text-sm text-gray-700">
              {new Date(sub.currentPeriodStart).toLocaleDateString('ja-JP')} 〜 {new Date(sub.currentPeriodEnd).toLocaleDateString('ja-JP')}
            </span>
          </div>
          {sub.cancelAtPeriodEnd && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              期間終了後に自動キャンセルされます
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">サブスクリプション情報が見つかりません</p>
        </div>
      )}

      <button
        onClick={handlePortal}
        disabled={portalLoading}
        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium rounded-xl transition-colors text-sm"
      >
        {portalLoading ? '読み込み中...' : '請求情報を管理（Stripe）'}
      </button>
      <p className="text-[10px] text-gray-400 text-center">支払い方法の変更・領収書・解約はStripeのポータルで管理できます</p>
    </div>
  );
}
