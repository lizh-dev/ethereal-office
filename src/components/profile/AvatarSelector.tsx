'use client';

import { useState } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import { AVATAR_STYLES, AVATAR_SEEDS, getAvatarUrl } from '@/components/floor/assets';

export default function AvatarSelector() {
  const { currentUser, setCurrentUserAvatar, setShowAvatarSelector } = useOfficeStore();
  const [selectedStyle, setSelectedStyle] = useState(currentUser.avatarStyle || 'notionists');
  const [selectedSeed, setSelectedSeed] = useState(currentUser.avatarSeed || 'tanaka');

  const handleConfirm = () => {
    setCurrentUserAvatar(selectedStyle, selectedSeed);
    setShowAvatarSelector(false);
  };

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
          <img src={getAvatarUrl(selectedSeed, selectedStyle)} alt="" className="w-14 h-14 rounded-full border-2 border-blue-400 bg-white" />
          <div>
            <p className="text-sm font-semibold text-gray-700">{currentUser.name}</p>
            <p className="text-[11px] text-gray-500">{AVATAR_STYLES.find(s => s.id === selectedStyle)?.label} / {selectedSeed}</p>
          </div>
        </div>

        {/* Style tabs */}
        <div className="px-6 pt-3 pb-2 flex gap-1.5 overflow-x-auto border-b border-gray-50">
          {AVATAR_STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => setSelectedStyle(style.id)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                selectedStyle === style.id
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
              const isSelected = selectedSeed === seed && selectedStyle === selectedStyle;
              return (
                <button
                  key={seed}
                  onClick={() => setSelectedSeed(seed)}
                  className={`aspect-square rounded-xl border-2 overflow-hidden transition-all hover:scale-105 ${
                    selectedSeed === seed ? 'border-blue-500 ring-2 ring-blue-100 scale-105' : 'border-gray-100 hover:border-gray-200'
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
