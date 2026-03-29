'use client';

import { useState } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import { ViewMode } from '@/types';

const navItems: { mode: ViewMode; label: string; icon: string }[] = [
  { mode: 'floor', label: 'フロア', icon: '🏢' },
  { mode: 'meetings', label: 'メンバー', icon: '👥' },
  { mode: 'chat', label: 'チャット', icon: '💬' },
  { mode: 'profile', label: '設定', icon: '⚙️' },
];

export default function Sidebar() {
  const { viewMode, setViewMode, editorMode, setEditorMode, unreadChatCount, markChatRead, isFloorOwner } = useOfficeStore();
  const [showPwModal, setShowPwModal] = useState(false);
  const [ownerPw, setOwnerPw] = useState('');
  const [pwError, setPwError] = useState('');

  const handleNavClick = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'chat') markChatRead();
  };

  const handleEditClick = () => {
    if (editorMode === 'edit') {
      setEditorMode('view');
      return;
    }
    if (isFloorOwner) {
      setEditorMode('edit');
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
      <aside className="w-[60px] bg-white border-r border-gray-200 flex flex-col items-center h-full py-3">
        {/* Logo */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg mb-4 shadow-md">
          W
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.mode}
              onClick={() => handleNavClick(item.mode)}
              className={`relative w-11 h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all text-[18px] ${
                viewMode === item.mode
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
              }`}
              title={item.label}
            >
              <span>{item.icon}</span>
              <span className="text-[7px] font-semibold tracking-wide">{item.label}</span>
              {item.mode === 'chat' && unreadChatCount > 0 && viewMode !== 'chat' && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[7px] font-bold rounded-full flex items-center justify-center border border-white">
                  {unreadChatCount > 9 ? '9+' : unreadChatCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Edit mode */}
        <button
          onClick={handleEditClick}
          className={`w-11 h-11 rounded-xl flex items-center justify-center mb-2 transition-all ${
            editorMode === 'edit'
              ? 'bg-amber-100 text-amber-600'
              : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
          }`}
          title={editorMode === 'edit' ? '編集終了' : 'フロアを編集（管理者パスワード必要）'}
        >
          <span className="text-lg">{isFloorOwner ? '✏️' : '🔒'}</span>
        </button>
      </aside>

      {/* Owner password modal */}
      {showPwModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]" onClick={() => setShowPwModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-800 mb-1">🔒 管理者認証</h2>
            <p className="text-sm text-gray-500 mb-4">フロアを編集するには管理者パスワードを入力してください</p>
            <input
              type="password"
              value={ownerPw}
              onChange={e => { setOwnerPw(e.target.value); setPwError(''); }}
              onKeyDown={e => { if (e.key === 'Enter') handlePwSubmit(); }}
              placeholder="管理者パスワード"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-gray-800 placeholder-gray-400 mb-3"
              autoFocus
            />
            {pwError && <p className="text-red-500 text-xs mb-3">{pwError}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => setShowPwModal(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl text-sm transition-colors"
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
