'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useOfficeStore } from '@/store/officeStore';
import { resolveAvatarUrl } from '@/components/floor/assets';
import { useWsSend } from '@/contexts/WebSocketContext';
import QRCodeModal from '@/components/QRCodeModal';
import { useFocusTimer } from '@/hooks/useFocusTimer';
import type { PresenceStatus } from '@/types';
import { Pencil, Search, Zap, Check, Share2, Coffee, Target, LogOut, ChevronDown, Plus, Building2, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

/** Returns true if the hex color is light (text should be dark) */
function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  if (c.length < 6) return true;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 258 + b * 114) / 1000 > 128;
}

const STATUS_COLORS: Record<string, string> = {
  online: '#4CAF50', busy: '#F44336', focusing: '#FF9800', offline: '#9CA3AF',
};
const STATUS_LABELS: Record<string, string> = {
  online: 'オンライン', busy: 'ビジー', focusing: '取込中', offline: 'オフライン',
};

const STATUS_OPTIONS: { value: PresenceStatus; label: string; color: string }[] = [
  { value: 'online', label: 'オンライン', color: '#4CAF50' },
  { value: 'busy', label: 'ビジー', color: '#F44336' },
  { value: 'focusing', label: '集中モード', color: '#FF9800' },
  { value: 'offline', label: '離席', color: '#9CA3AF' },
];

interface FloorEntry {
  id: string;
  slug: string;
  name: string;
  createdAt: string;
}

export default function TopBar() {
  const { currentUser, editorMode, exportFloorPlan, setShowAvatarSelector, setCurrentUserStatus, setStatusMessage, statusMessage, searchQuery, setSearchQuery, chatMessages, notifications, setViewMode, floorPlanType, branding, ownerEmail, floorSlug, isFloorOwner } = useOfficeStore();
  const wsSend = useWsSend();
  const { toggle, isDark } = useTheme();
  const focusTimer = useFocusTimer();
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showFloorSwitcher, setShowFloorSwitcher] = useState(false);
  const [ownerFloors, setOwnerFloors] = useState<FloorEntry[]>([]);
  const [statusMsgInput, setStatusMsgInput] = useState(statusMessage || '');
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const floorSwitcherRef = useRef<HTMLDivElement>(null);

  // Close status menu when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setShowStatusMenu(false);
      }
      if (floorSwitcherRef.current && !floorSwitcherRef.current.contains(e.target as Node)) {
        setShowFloorSwitcher(false);
      }
    };
    if (showStatusMenu || showFloorSwitcher) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [showStatusMenu, showFloorSwitcher]);

  // Fetch owner's floors when switcher opens
  useEffect(() => {
    if (showFloorSwitcher && ownerEmail) {
      fetch(`/api/floors/by-owner?email=${encodeURIComponent(ownerEmail)}`)
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setOwnerFloors(data); })
        .catch(() => {});
    }
  }, [showFloorSwitcher, ownerEmail]);

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

  const accentColor = branding.accentColor || '#0ea5e9';
  const accentTargets = branding.accentTargets || { header: false, sidebar: false, buttons: false };
  const headerAccent = accentTargets.header;
  const headerTextColor = headerAccent ? (isLightColor(accentColor) ? '#1f2937' : '#ffffff') : undefined;
  const headerBorderColor = headerAccent ? (isLightColor(accentColor) ? '#e5e7eb' : 'rgba(255,255,255,0.15)') : undefined;

  return (
    <header
      className={`h-[50px] flex items-center justify-between px-3 md:px-4 ${headerAccent ? '' : 'bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800'}`}
      style={headerAccent ? { backgroundColor: accentColor, borderBottom: `1px solid ${headerBorderColor}` } : undefined}
    >
      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={() => useOfficeStore.getState().setViewMode('floor')}
          className={`text-base font-bold flex items-center gap-1.5 md:gap-2 transition-colors ${headerAccent ? '' : 'text-zinc-800 dark:text-zinc-200 hover:text-accent'}`}
          style={headerAccent ? { color: headerTextColor } : undefined}
          title="フロアに戻る"
        >
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt="Logo" style={{ width: 24, height: 24, objectFit: 'contain', borderRadius: 4 }} />
          ) : (
            <span style={headerAccent ? { color: headerTextColor, opacity: 0.8 } : undefined} className={headerAccent ? '' : 'text-accent'}>{(branding.floorTitle || 'S')[0]}</span>
          )}
          <span className="hidden md:inline">{branding.floorTitle || 'SmartOffice'}</span>
        </button>

        {/* Floor Switcher */}
        {ownerEmail && isFloorOwner && (
          <div ref={floorSwitcherRef} className="relative">
            <button
              onClick={() => setShowFloorSwitcher(!showFloorSwitcher)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors text-[12px] font-medium ${headerAccent ? '' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}
              style={headerAccent ? { color: headerTextColor } : undefined}
            >
              <Building2 className="w-3.5 h-3.5" strokeWidth={1.8} />
              <ChevronDown className="w-3 h-3" strokeWidth={2} />
            </button>
            {showFloorSwitcher && (
              <div className="absolute left-0 top-full mt-1 w-72 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 py-1.5 z-[100]"
                style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}
              >
                <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">フロア一覧</div>
                {ownerFloors.map(f => (
                  <a
                    key={f.slug}
                    href={`/f/${f.slug}`}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left ${f.slug === floorSlug ? 'bg-amber-50 dark:bg-amber-500/10' : ''}`}
                  >
                    <Building2 className="w-4 h-4 text-zinc-400 dark:text-zinc-500 flex-shrink-0" strokeWidth={1.5} />
                    <div className="min-w-0">
                      <div className={`text-[12px] ${f.slug === floorSlug ? 'font-bold text-accent' : 'font-medium text-zinc-600 dark:text-zinc-400'}`}>
                        {f.name}
                      </div>
                      <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">/f/{f.slug}</div>
                    </div>
                    {f.slug === floorSlug && <Check className="ml-auto w-3.5 h-3.5 text-accent flex-shrink-0" strokeWidth={2} />}
                  </a>
                ))}
                {floorPlanType === 'pro' && (
                  <div className="border-t border-zinc-200 dark:border-zinc-800 mt-1 pt-1">
                    <Link
                      href="/#create"
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors text-left"
                      onClick={() => setShowFloorSwitcher(false)}
                    >
                      <Plus className="w-4 h-4 text-accent" strokeWidth={2} />
                      <span className="text-[12px] font-medium text-accent">新しいフロアを作成</span>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {editorMode === 'edit' && (
          <span className="text-[11px] px-2 md:px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full font-medium border border-amber-200">
            <Pencil className="inline w-3.5 h-3.5" strokeWidth={1.8} /> <span className="hidden sm:inline">編集モード</span><span className="sm:hidden">編集</span>
          </span>
        )}
      </div>

      {/* Search - responsive, compact on mobile */}
      <div className="flex-1 max-w-md mx-2 md:mx-6">
        <div className="relative">
          <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${headerAccent ? '' : 'text-zinc-400 dark:text-zinc-500'}`} style={headerAccent ? { color: headerTextColor, opacity: 0.5 } : undefined}><Search className="w-3.5 h-3.5" strokeWidth={1.8} /></span>
          <input type="text" placeholder="メンバーを検索..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={`w-full h-8 md:h-9 pl-8 md:pl-9 pr-3 md:pr-4 rounded-full text-xs md:text-sm focus:outline-none transition-colors ${
              headerAccent
                ? 'border placeholder:text-white/50'
                : 'bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 placeholder:text-zinc-400 focus:border-blue-300 focus:bg-white dark:focus:bg-zinc-800'
            }`}
            style={headerAccent ? { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.2)', color: headerTextColor } : undefined}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Pro badge or upgrade link */}
        {floorPlanType === 'free' ? (
          <Link
            href={`/f/${typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : ''}/upgrade`}
            className="text-[11px] px-2 md:px-3 py-1.5 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 rounded-lg font-semibold text-white transition-all shadow-sm"
            title="Proプランにアップグレード"
          >
            <span className="md:hidden"><Zap className="w-3.5 h-3.5 inline" strokeWidth={1.8} /></span>
            <span className="hidden md:inline"><Zap className="w-3.5 h-3.5 inline" strokeWidth={1.8} /> Pro</span>
          </Link>
        ) : (
          <span
            className={`text-[11px] px-2 md:px-3 py-1.5 rounded-lg font-semibold shadow-sm ${accentTargets.buttons ? '' : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'}`}
            style={accentTargets.buttons ? { background: accentColor, color: isLightColor(accentColor) ? '#1f2937' : '#ffffff' } : undefined}
          >
            <span className="md:hidden"><Check className="w-3.5 h-3.5 inline" strokeWidth={1.8} /></span>
            <span className="hidden md:inline"><Check className="w-3.5 h-3.5 inline" strokeWidth={1.8} /> Pro</span>
          </span>
        )}

        {/* Share button - icon only on mobile */}
        <button
          onClick={() => setShowQR(true)}
          title="フロアを共有"
          className={`text-[11px] px-2 md:px-3 py-1.5 rounded-lg font-medium transition-colors ${
            accentTargets.buttons
              ? ''
              : headerAccent
                ? ''
                : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
          }`}
          style={
            accentTargets.buttons
              ? { background: accentColor, color: isLightColor(accentColor) ? '#1f2937' : '#ffffff' }
              : headerAccent
                ? { background: 'rgba(255,255,255,0.15)', color: headerTextColor }
                : undefined
          }
        >
          <span className="md:hidden"><Share2 className="w-3.5 h-3.5 inline" strokeWidth={1.8} /></span>
          <span className="hidden md:inline"><Share2 className="w-3.5 h-3.5 inline" strokeWidth={1.8} /> 共有</span>
        </button>

        {/* Dark/Light toggle */}
        <button onClick={toggle} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" aria-label="テーマ切替">
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User avatar - click to change avatar */}
        <button
          onClick={() => setShowAvatarSelector(true)}
          className={`pl-2 md:pl-3 border-l rounded-lg pr-1 py-1 transition-colors ${headerAccent ? '' : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
          style={headerAccent ? { borderColor: 'rgba(255,255,255,0.2)' } : undefined}
        >
          <div className="relative">
            <img
              src={resolveAvatarUrl(currentUser)}
              alt="" className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 border-2"
              style={{ borderColor: STATUS_COLORS[currentUser.status] }}
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 md:w-3.5 md:h-3.5 rounded-full border-2 border-white" style={{ background: STATUS_COLORS[currentUser.status] }} />
          </div>
        </button>

        {/* Status dropdown */}
        <div ref={statusMenuRef} className="relative">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className={`flex items-center gap-1.5 rounded-lg px-1.5 md:px-2 py-1 transition-colors ${headerAccent ? '' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
          >
            <div className="text-left">
              <div className={`text-[11px] md:text-[12px] font-semibold max-w-[60px] md:max-w-none truncate ${headerAccent ? '' : 'text-zinc-800 dark:text-zinc-200'}`} style={headerAccent ? { color: headerTextColor } : undefined}>{currentUser.name}</div>
              <div className="text-[10px] font-medium flex items-center gap-1" style={{ color: STATUS_COLORS[currentUser.status] }}>
                <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLORS[currentUser.status] }} />
                <span className="hidden sm:inline">{statusMessage ? statusMessage : STATUS_LABELS[currentUser.status]}</span>
              </div>
            </div>
            <span className={`text-xs ml-0.5 ${headerAccent ? '' : 'text-zinc-400 dark:text-zinc-500'}`} style={headerAccent ? { color: headerTextColor, opacity: 0.5 } : undefined}>▾</span>
          </button>

          {showStatusMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 py-1.5 z-[100]"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}
            >
              <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">ステータス変更</div>
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setCurrentUserStatus(opt.value);
                    wsSend.status(opt.value, statusMsgInput);
                    setShowStatusMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: opt.color, boxShadow: currentUser.status === opt.value ? `0 0 0 2px white, 0 0 0 3.5px ${opt.color}` : 'none' }}
                  />
                  <span className={`text-[12px] ${currentUser.status === opt.value ? 'font-bold text-zinc-900 dark:text-zinc-100' : 'font-medium text-zinc-600 dark:text-zinc-400'}`}>
                    {opt.label}
                  </span>
                  {currentUser.status === opt.value && (
                    <Check className="ml-auto w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" strokeWidth={1.8} />
                  )}
                </button>
              ))}
              <div className="border-t border-zinc-200 dark:border-zinc-800 mt-1 pt-1 px-3 py-2">
                <div className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">ステータスメッセージ</div>
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
                  className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[12px] text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 focus:outline-none focus:border-blue-300 focus:bg-white dark:focus:bg-zinc-800 transition-colors"
                />
              </div>
              {/* Focus mode */}
              <div className="border-t border-zinc-200 dark:border-zinc-800 mt-1 pt-1 px-3 py-2">
                <div className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">集中モード</div>
                {focusTimer.isActive ? (
                  <button
                    onClick={() => { focusTimer.stopFocus(); setShowStatusMenu(false); }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg bg-amber-50 text-amber-600 text-[12px] font-semibold"
                  >
                    <span>{focusTimer.isBreak ? <Coffee className="w-3.5 h-3.5 inline" strokeWidth={1.8} /> : <Target className="w-3.5 h-3.5 inline" strokeWidth={1.8} />}</span>
                    <span>{Math.floor(focusTimer.remainingSeconds / 60)}:{(focusTimer.remainingSeconds % 60).toString().padStart(2, '0')}</span>
                    <span className="ml-auto text-[10px] text-amber-400">停止</span>
                  </button>
                ) : (
                  <div className="flex gap-1.5">
                    {[15, 25, 50].map(min => (
                      <button key={min}
                        onClick={() => { focusTimer.startFocus(min); setShowStatusMenu(false); }}
                        className="flex-1 px-2 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-600 text-[12px] font-medium text-zinc-600 dark:text-zinc-400 transition-colors text-center"
                      >{min}分</button>
                    ))}
                  </div>
                )}
              </div>
              <div className="border-t border-zinc-200 dark:border-zinc-800 mt-1 pt-1">
                <button
                  onClick={() => { window.location.href = '/'; }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" strokeWidth={1.8} />
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
