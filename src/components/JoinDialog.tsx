'use client';

import { useState, useEffect } from 'react';

const AVATAR_STYLES = ['notionists', 'avataaars', 'big-smile', 'adventurer', 'personas', 'lorelei'];
const AVATAR_SEEDS = ['田中', '佐藤', '鈴木', '高橋', '伊藤', '渡辺', '山本', '中村', '小林', '加藤', '吉田', '山田'];

interface JoinDialogProps {
  floorName: string;
  onJoin: (name: string, avatarStyle: string, avatarSeed: string) => void;
}

export default function JoinDialog({ floorName, onJoin }: JoinDialogProps) {
  const [name, setName] = useState('');
  const [avatarStyle, setAvatarStyle] = useState('notionists');
  const [avatarSeed, setAvatarSeed] = useState('田中');

  // Restore from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ethereal-office-user');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.name) setName(data.name);
        if (data.avatarStyle) setAvatarStyle(data.avatarStyle);
        if (data.avatarSeed) setAvatarSeed(data.avatarSeed);
      } catch { /* ignore */ }
    }
  }, []);

  const handleJoin = () => {
    if (!name.trim()) return;
    localStorage.setItem('ethereal-office-user', JSON.stringify({
      name: name.trim(),
      avatarStyle,
      avatarSeed,
    }));
    onJoin(name.trim(), avatarStyle, avatarSeed);
  };

  const avatarUrl = `https://api.dicebear.com/9.x/${avatarStyle}/svg?seed=${encodeURIComponent(avatarSeed)}&radius=50`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-1">{floorName}</h2>
          <p className="text-gray-500 text-sm">フロアに参加するには名前を入力してください</p>
        </div>

        {/* Avatar preview */}
        <div className="flex justify-center mb-6">
          <img
            src={avatarUrl}
            alt="avatar"
            className="w-20 h-20 rounded-full border-4 border-indigo-100"
          />
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              名前 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              placeholder="名前を入力"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-gray-800 placeholder-gray-400"
              autoFocus
            />
          </div>

          {/* Avatar style selector */}
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

          {/* Avatar seed selector */}
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

          <button
            onClick={handleJoin}
            disabled={!name.trim()}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium rounded-xl transition-colors"
          >
            入室する
          </button>
        </div>
      </div>
    </div>
  );
}
