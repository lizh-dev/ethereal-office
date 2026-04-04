'use client';

import { useState, useRef } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import { AVATAR_STYLES, AVATAR_SEEDS, getAvatarUrl } from '@/components/floor/assets';
import { Upload, X } from 'lucide-react';

const MAX_CUSTOM_AVATAR_SIZE = 200 * 1024; // 200KB

export default function AvatarSelector() {
  const { currentUser, setCurrentUserAvatar, setCustomAvatar, setShowAvatarSelector, planPermissions } = useOfficeStore();
  const [selectedStyle, setSelectedStyle] = useState(currentUser.avatarStyle || 'notionists');
  const [selectedSeed, setSelectedSeed] = useState(currentUser.avatarSeed || 'tanaka');
  const [customAvatarUrl, setCustomAvatarUrlLocal] = useState(currentUser.customAvatarUrl || '');
  const [useCustom, setUseCustom] = useState(!!currentUser.customAvatarUrl);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setUseCustom(true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleConfirm = () => {
    const finalCustomAvatarUrl = useCustom ? customAvatarUrl : '';
    setCurrentUserAvatar(selectedStyle, selectedSeed);
    setCustomAvatar(finalCustomAvatarUrl);
    // Persist to localStorage
    try {
      const saved = JSON.parse(localStorage.getItem('ethereal-office-user') || '{}');
      saved.customAvatarUrl = finalCustomAvatarUrl;
      localStorage.setItem('ethereal-office-user', JSON.stringify(saved));
      if (finalCustomAvatarUrl) {
        localStorage.setItem('ethereal-custom-avatar', finalCustomAvatarUrl);
      } else {
        localStorage.removeItem('ethereal-custom-avatar');
      }
    } catch { /* ignore */ }
    setShowAvatarSelector(false);
  };

  const previewUrl = useCustom && customAvatarUrl
    ? customAvatarUrl
    : getAvatarUrl(selectedSeed, selectedStyle);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[560px] max-h-[85vh] overflow-hidden flex flex-col animate-float-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800">アバターを選択</h2>
          <button onClick={() => setShowAvatarSelector(false)} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
        </div>

        {/* Preview */}
        <div className="px-6 py-3 flex items-center gap-4 bg-gray-50 border-b border-gray-100">
          <img
            src={previewUrl}
            alt=""
            className="w-14 h-14 rounded-full border-2 border-blue-400 bg-white"
            style={{ objectFit: 'cover' }}
          />
          <div>
            <p className="text-sm font-semibold text-gray-700">{currentUser.name}</p>
            <p className="text-[11px] text-gray-500">
              {useCustom && customAvatarUrl
                ? 'カスタム画像'
                : `${AVATAR_STYLES.find(s => s.id === selectedStyle)?.label} / ${selectedSeed}`
              }
            </p>
          </div>
        </div>

        {/* Custom avatar upload — Pro only, hidden for Free */}
        {canCustomAvatar && (
          <div className="px-6 py-3 border-b border-gray-100">
            {useCustom && customAvatarUrl ? (
              <div className="flex items-center gap-3">
                <img
                  src={customAvatarUrl}
                  alt="custom"
                  className="w-10 h-10 rounded-full border-2 border-indigo-300"
                  style={{ objectFit: 'cover' }}
                />
                <span className="text-xs text-indigo-600 font-medium flex-1">カスタム画像を使用中</span>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  変更
                </button>
                <button
                  onClick={() => { setCustomAvatarUrlLocal(''); setUseCustom(false); }}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-0.5"
                >
                  <X className="w-3 h-3" /> 削除
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-xs text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors w-full justify-center"
              >
                <Upload className="w-3.5 h-3.5" />
                画像をアップロード (200KB以下)
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
          </div>
        )}

        {/* Style tabs */}
        <div className="px-6 pt-3 pb-2 flex gap-1.5 overflow-x-auto border-b border-gray-50">
          {AVATAR_STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => { setSelectedStyle(style.id); setUseCustom(false); }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                !useCustom && selectedStyle === style.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-100'
              }`}
            >
              {style.label}
            </button>
          ))}
        </div>

        {/* Avatar grid */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-6 gap-2.5">
            {AVATAR_SEEDS.map((seed) => {
              return (
                <button
                  key={seed}
                  onClick={() => { setSelectedSeed(seed); setUseCustom(false); }}
                  className={`aspect-square rounded-xl border-2 overflow-hidden transition-all hover:scale-105 ${
                    !useCustom && selectedSeed === seed ? 'border-blue-500 ring-2 ring-blue-100 scale-105' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <img src={getAvatarUrl(seed, selectedStyle)} alt={seed} className="w-full h-full bg-gray-50" loading="lazy" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <span className="text-[10px] text-gray-400">Powered by DiceBear</span>
          <div className="flex gap-2">
            <button onClick={() => setShowAvatarSelector(false)} className="px-4 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">キャンセル</button>
            <button onClick={handleConfirm} className="px-4 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors">決定</button>
          </div>
        </div>
      </div>
    </div>
  );
}
