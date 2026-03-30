'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useOfficeStore } from '@/store/officeStore';
import { getAvatarUrl } from '@/components/floor/assets';
import { useWsSend } from '@/contexts/WebSocketContext';
import QRCodeModal from '@/components/QRCodeModal';
import type { PresenceStatus } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  online: '#4CAF50', busy: '#F44336', focusing: '#FF9800', offline: '#9CA3AF',
};
const STATUS_LABELS: Record<string, string> = {
  online: 'オンライン', busy: 'ビジー', focusing: '集中中', offline: 'オフライン',
};

const STATUS_OPTIONS: { value: PresenceStatus; label: string; color: string }[] = [
  { value: 'online', label: 'オンライン', color: '#4CAF50' },
  { value: 'busy', label: 'ビジー', color: '#F44336' },
  { value: 'focusing', label: '集中モード', color: '#FF9800' },
  { value: 'offline', label: '離席', color: '#9CA3AF' },
];

export default function TopBar() {
  const { currentUser, editorMode, exportFloorPlan, setShowAvatarSelector, setCurrentUserStatus, setStatusMessage, statusMessage, searchQuery, setSearchQuery, chatMessages, notifications, setViewMode } = useOfficeStore();
  const wsSend = useWsSend();
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [statusMsgInput, setStatusMsgInput] = useState(statusMessage || '');
  const statusMenuRef = useRef<HTMLDivElement>(null);

  // Close status menu when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setShowStatusMenu(false);
      }
    };
    if (showStatusMenu) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [showStatusMenu]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const store = useOfficeStore.getState();
    const api = store.excalidrawAPI;
    const exportData = {
      version: 1,
      name: 'SmartOffice Floor Export',
      excalidrawScene: api ? {
        elements: api.getSceneElements(),
        appState: (() => { const { collaborators, ...rest } = api.getAppState(); return rest; })(),
      } : null,
      zones: store.zones,
      floorPlan: store.exportFloorPlan ? JSON.parse(store.exportFloorPlan()) : null,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `floor-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        const store = useOfficeStore.getState();
        const api = store.excalidrawAPI;
        if (data.excalidrawScene && api) {
          api.updateScene({
            elements: data.excalidrawScene.elements,
            appState: data.excalidrawScene.appState,
          });
        }
        if (data.zones) {
          store.setZones(data.zones);
        }
        useOfficeStore.getState().addNotification('フロア設定をインポートしました');
      } catch {
        useOfficeStore.getState().addNotification('インポートに失敗しました');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="h-[50px] bg-white border-b border-gray-200 flex items-center justify-between px-3 md:px-4">
      <div className="flex items-center gap-2 md:gap-4">
        <Link href="/" className="text-base font-bold text-gray-800 flex items-center gap-1.5 md:gap-2 hover:text-sky-600 transition-colors" title="ホームに戻る">
          <span className="text-sky-500">S</span>
          <span className="hidden md:inline">SmartOffice</span>
        </Link>
        {editorMode === 'edit' && (
          <span className="text-[11px] px-2 md:px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full font-medium border border-amber-200">
            ✏️ <span className="hidden sm:inline">編集モード</span><span className="sm:hidden">編集</span>
          </span>
        )}
      </div>

      {/* Search - responsive, compact on mobile */}
      <div className="flex-1 max-w-md mx-2 md:mx-6">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input type="text" placeholder="メンバーを検索..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-8 md:h-9 pl-8 md:pl-9 pr-3 md:pr-4 bg-gray-50 border border-gray-200 rounded-full text-xs md:text-sm text-gray-600 placeholder:text-gray-400 focus:outline-none focus:border-blue-300 focus:bg-white transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Share button - icon only on mobile */}
        <button onClick={() => setShowQR(true)} title="フロアを共有" className="text-[11px] px-2 md:px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-600 transition-colors">
          <span className="md:hidden">📱</span>
          <span className="hidden md:inline">📱 共有</span>
        </button>

        {/* User avatar - click to change avatar */}
        <button
          onClick={() => setShowAvatarSelector(true)}
          className="pl-2 md:pl-3 border-l border-gray-200 hover:bg-gray-50 rounded-lg pr-1 py-1 transition-colors"
        >
          <div className="relative">
            <img
              src={getAvatarUrl(currentUser.avatarSeed || currentUser.name, currentUser.avatarStyle || 'notionists')}
              alt="" className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gray-100 border-2"
              style={{ borderColor: STATUS_COLORS[currentUser.status] }}
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 md:w-3.5 md:h-3.5 rounded-full border-2 border-white" style={{ background: STATUS_COLORS[currentUser.status] }} />
          </div>
        </button>

        {/* Status dropdown */}
        <div ref={statusMenuRef} className="relative">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className="flex items-center gap-1.5 hover:bg-gray-50 rounded-lg px-1.5 md:px-2 py-1 transition-colors"
          >
            <div className="text-left">
              <div className="text-[11px] md:text-[12px] font-semibold text-gray-800 max-w-[60px] md:max-w-none truncate">{currentUser.name}</div>
              <div className="text-[10px] font-medium flex items-center gap-1" style={{ color: STATUS_COLORS[currentUser.status] }}>
                <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLORS[currentUser.status] }} />
                <span className="hidden sm:inline">{statusMessage ? statusMessage : STATUS_LABELS[currentUser.status]}</span>
              </div>
            </div>
            <span className="text-gray-400 text-xs ml-0.5">▾</span>
          </button>

          {showStatusMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-[100]"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}
            >
              <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">ステータス変更</div>
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setCurrentUserStatus(opt.value);
                    wsSend.status(opt.value, statusMsgInput);
                    setShowStatusMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: opt.color, boxShadow: currentUser.status === opt.value ? `0 0 0 2px white, 0 0 0 3.5px ${opt.color}` : 'none' }}
                  />
                  <span className={`text-[12px] ${currentUser.status === opt.value ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}>
                    {opt.label}
                  </span>
                  {currentUser.status === opt.value && (
                    <span className="ml-auto text-[11px] text-gray-400">✓</span>
                  )}
                </button>
              ))}
              <div className="border-t border-gray-100 mt-1 pt-1 px-3 py-2">
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">ステータスメッセージ</div>
                <input
                  type="text"
                  value={statusMsgInput}
                  onChange={e => setStatusMsgInput(e.target.value)}
                  onBlur={() => {
                    setStatusMessage(statusMsgInput);
                    wsSend.status(currentUser.status, statusMsgInput);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      setStatusMessage(statusMsgInput);
                      wsSend.status(currentUser.status, statusMsgInput);
                      setShowStatusMenu(false);
                    }
                  }}
                  placeholder="ステータスメッセージ（任意）"
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[12px] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-blue-300 focus:bg-white transition-colors"
                />
              </div>
              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  onClick={() => { window.location.href = '/'; }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-red-50 transition-colors text-left"
                >
                  <span className="text-sm">🚪</span>
                  <span className="text-[12px] font-medium text-red-500">退室する</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {showQR && (
        <QRCodeModal
          url={typeof window !== 'undefined' ? window.location.href : ''}
          floorName="フロア"
          onClose={() => setShowQR(false)}
        />
      )}
    </header>
  );
}
