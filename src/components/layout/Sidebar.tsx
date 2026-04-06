'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useOfficeStore } from '@/store/officeStore';
import { ViewMode } from '@/types';
import { Building2, Users, Video, MessageCircle, Settings, Pencil, Lock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const navItems: { mode: ViewMode; label: string; Icon: LucideIcon }[] = [
  { mode: 'floor', label: 'フロア', Icon: Building2 },
  { mode: 'members', label: 'メンバー', Icon: Users },
  { mode: 'meetings', label: '会議室', Icon: Video },
  { mode: 'chat', label: 'チャット', Icon: MessageCircle },
  { mode: 'profile', label: '設定', Icon: Settings },
];

export default function Sidebar() {
  const { viewMode, setViewMode, editorMode, setEditorMode, unreadChatCount, markChatRead, isFloorOwner, floorPlanType, branding } = useOfficeStore();
  const [showPwModal, setShowPwModal] = useState(false);
  const [ownerPw, setOwnerPw] = useState('');
  const [pwError, setPwError] = useState('');

  const isPro = floorPlanType === 'pro';
  const floorSlug = typeof window !== 'undefined' ? (window.location.pathname.split('/f/')[1] || '') : '';
  const accentColor = branding.accentColor || '#0ea5e9';
  const sidebarAccent = branding.accentTargets?.sidebar ?? false;

  const handleNavClick = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'chat') markChatRead();
  };

  const handleEditClick = () => {
    if (editorMode === 'edit') {
      window.location.reload();
      return;
    }
    if (isFloorOwner) {
      setEditorMode('edit');
      return;
    }
    const slug = window.location.pathname.split('/f/')[1];
    const tokens = JSON.parse(localStorage.getItem('ethereal-edit-tokens') || '{}');
    if (tokens[slug]) {
      fetch(`/api/floors/${slug}/verify-owner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Edit-Token': tokens[slug] },
        body: JSON.stringify({ ownerPassword: '' }),
      }).then(r => r.json()).then(data => {
        if (data.canEdit) {
          useOfficeStore.getState().setIsFloorOwner(true);
          sessionStorage.setItem(`ethereal-owner-${slug}`, 'true');
          setEditorMode('edit');
        } else {
          setShowPwModal(true); setOwnerPw(''); setPwError('');
        }
      }).catch(() => { setShowPwModal(true); setOwnerPw(''); setPwError(''); });
      return;
    }
    setShowPwModal(true);
    setOwnerPw('');
    setPwError('');
  };

  const handlePwSubmit = async () => {
    if (!ownerPw.trim()) return;
    try {
      const slug = window.location.pathname.split('/f/')[1];
      const res = await fetch(`/api/floors/${slug}/verify-owner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerPassword: ownerPw }),
      });
      const data = await res.json();
      if (data.canEdit) {
        useOfficeStore.getState().setIsFloorOwner(true);
        sessionStorage.setItem(`ethereal-owner-${slug}`, 'true');
        sessionStorage.setItem(`ethereal-owner-pw-${slug}`, ownerPw);
        setEditorMode('edit');
        setShowPwModal(false);
      } else {
        setPwError('パスワードが正しくありません');
      }
    } catch {
      setPwError('認証に失敗しました');
    }
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[60px] bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex-col items-center h-full py-3">
        {/* Home link */}
        <Link
          href="/"
          className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-accent hover:border-amber-200 dark:hover:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-500/10 mb-4 transition-all"
          title="ホームに戻る"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </Link>

        {/* Nav */}
        <nav className="flex-1 flex flex-col items-center gap-1">
          {navItems.map((item) => {
            const isActive = viewMode === item.mode;
            const useAccent = isActive && sidebarAccent;
            return (
              <button
                key={item.mode}
                onClick={() => handleNavClick(item.mode)}
                className={`relative w-11 h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${
                  isActive
                    ? useAccent ? '' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'text-zinc-400 dark:text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-600 dark:hover:text-zinc-300'
                }`}
                style={useAccent ? { backgroundColor: accentColor + '1a', color: accentColor } : undefined}
                title={item.label}
              >
                <item.Icon className="w-[18px] h-[18px]" strokeWidth={1.8} />
                <span className="text-[7px] font-semibold tracking-wide">{item.label}</span>
                {item.mode === 'chat' && unreadChatCount > 0 && viewMode !== 'chat' && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[7px] font-bold rounded-full flex items-center justify-center border border-white">
                    {unreadChatCount > 9 ? '9+' : unreadChatCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Plan badge */}
        {isPro ? (
          <span className="mb-2 px-2 py-0.5 rounded-full text-[8px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
            Pro
          </span>
        ) : (
          <Link
            href={`/f/${floorSlug}/upgrade`}
            className="mb-2 px-2 py-0.5 rounded-full text-[8px] font-bold bg-zinc-50 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-800 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-accent hover:border-amber-200 dark:hover:border-amber-700 transition-colors"
            title="Proプランにアップグレード"
          >
            Free
          </Link>
        )}

        {/* Edit mode */}
        <div className="relative group">
          <button
            onClick={handleEditClick}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
              editorMode === 'edit'
                ? 'bg-amber-100 text-amber-600'
                : 'text-zinc-400 dark:text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-600 dark:hover:text-zinc-300'
            }`}
            title={editorMode === 'edit' ? '編集終了' : 'フロアを編集（管理者パスワード必要）'}
          >
            {isFloorOwner ? <Pencil className="w-[18px] h-[18px]" strokeWidth={1.8} /> : <Lock className="w-[18px] h-[18px]" strokeWidth={1.8} />}
          </button>
          {!isFloorOwner && editorMode !== 'edit' && (
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:block z-50">
              <div className="bg-zinc-800 dark:bg-zinc-700 text-white text-[10px] px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
                管理者パスワードで編集可能
                <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-zinc-800 dark:border-r-zinc-700" />
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-around z-50 safe-area-bottom">
        {navItems.map((item) => {
          const isActive = viewMode === item.mode;
          const useAccent = isActive && sidebarAccent;
          return (
            <button
              key={item.mode}
              onClick={() => handleNavClick(item.mode)}
              className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                isActive
                  ? useAccent ? '' : 'text-amber-600 dark:text-amber-400'
                  : 'text-zinc-400 dark:text-zinc-500'
              }`}
              style={useAccent ? { color: accentColor } : undefined}
            >
              <item.Icon className="w-[18px] h-[18px]" strokeWidth={1.8} />
              <span className="text-[9px] font-semibold">{item.label}</span>
              {item.mode === 'chat' && unreadChatCount > 0 && viewMode !== 'chat' && (
                <span className="absolute top-1 right-1/4 w-4 h-4 bg-red-500 text-white text-[7px] font-bold rounded-full flex items-center justify-center">
                  {unreadChatCount > 9 ? '9+' : unreadChatCount}
                </span>
              )}
            </button>
          );
        })}
        <button
          onClick={handleEditClick}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
            editorMode === 'edit'
              ? 'text-amber-600'
              : 'text-zinc-400 dark:text-zinc-500'
          }`}
        >
          {editorMode === 'edit' || isFloorOwner
            ? <Pencil className="w-[18px] h-[18px]" strokeWidth={1.8} />
            : <Lock className="w-[18px] h-[18px]" strokeWidth={1.8} />}
          <span className="text-[9px] font-semibold">編集</span>
        </button>
      </nav>

      {/* Owner password modal */}
      {showPwModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]" onClick={() => setShowPwModal(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4 dark:border dark:border-zinc-700" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-1 flex items-center gap-2"><Lock className="w-5 h-5" strokeWidth={1.8} /> 管理者認証</h2>
            <p className="text-sm text-zinc-500 mb-4">フロアを編集するには管理者パスワードを入力してください</p>
            <input
              type="password"
              value={ownerPw}
              onChange={e => { setOwnerPw(e.target.value); setPwError(''); }}
              onKeyDown={e => { if (e.key === 'Enter') handlePwSubmit(); }}
              placeholder="管理者パスワード"
              className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-zinc-800 dark:text-zinc-100 dark:bg-zinc-800 placeholder-zinc-400 mb-3"
              autoFocus
            />
            {pwError && <p className="text-red-500 text-xs mb-3">{pwError}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => setShowPwModal(false)}
                className="flex-1 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl text-sm transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handlePwSubmit}
                disabled={!ownerPw.trim()}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium rounded-xl text-sm transition-colors"
              >
                認証
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
