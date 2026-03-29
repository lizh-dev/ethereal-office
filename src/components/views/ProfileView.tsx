'use client';

import { useState } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import { getAvatarUrl } from '@/components/floor/assets';

const AVATAR_STYLES = ['notionists', 'avataaars', 'big-smile', 'adventurer', 'personas', 'lorelei'];
const AVATAR_SEEDS = ['田中', '佐藤', '鈴木', '高橋', '伊藤', '渡辺', '山本', '中村', '小林', '加藤', '吉田', '山田'];

export default function ProfileView() {
  const { currentUser, setCurrentUserAvatar } = useOfficeStore();
  const [name, setName] = useState(currentUser.name);
  const [avatarStyle, setAvatarStyle] = useState(currentUser.avatarStyle || 'notionists');
  const [avatarSeed, setAvatarSeed] = useState(currentUser.avatarSeed || 'default');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Update store
    useOfficeStore.setState((state) => ({
      currentUser: {
        ...state.currentUser,
        name: name.trim() || state.currentUser.name,
        avatarStyle,
        avatarSeed,
        initials: (name.trim() || state.currentUser.name)[0],
      },
    }));
    setCurrentUserAvatar(avatarStyle, avatarSeed);

    // Update localStorage
    localStorage.setItem('ethereal-office-user', JSON.stringify({
      name: name.trim(),
      avatarStyle,
      avatarSeed,
    }));

    // Notify other users via WS (name change by reconnecting would be complex, so just update locally for now)
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const avatarUrl = getAvatarUrl(avatarSeed, avatarStyle);

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
      {/* Header */}
      <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4">
        <h2 className="text-sm font-semibold text-gray-700">⚙️ プロフィール設定</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-md mx-auto space-y-6">
          {/* Avatar preview */}
          <div className="flex justify-center">
            <img
              src={avatarUrl}
              alt="avatar"
              className="w-24 h-24 rounded-full border-4 border-indigo-100"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">表示名</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-gray-800"
            />
          </div>

          {/* Avatar style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">アバタースタイル</label>
            <div className="grid grid-cols-6 gap-2">
              {AVATAR_STYLES.map((style) => (
                <button
                  key={style}
                  onClick={() => setAvatarStyle(style)}
                  className={`p-1 rounded-lg border-2 transition-all ${
                    avatarStyle === style ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={`https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(avatarSeed)}&radius=50`}
                    alt={style}
                    className="w-full rounded"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Avatar seed */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">キャラクター</label>
            <div className="grid grid-cols-6 gap-2">
              {AVATAR_SEEDS.map((seed) => (
                <button
                  key={seed}
                  onClick={() => setAvatarSeed(seed)}
                  className={`p-1 rounded-lg border-2 transition-all ${
                    avatarSeed === seed ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={`https://api.dicebear.com/9.x/${avatarStyle}/svg?seed=${encodeURIComponent(seed)}&radius=50`}
                    alt={seed}
                    className="w-full rounded"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors text-sm"
          >
            {saved ? '✓ 保存しました' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
