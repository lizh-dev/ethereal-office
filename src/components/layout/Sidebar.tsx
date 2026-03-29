'use client';

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

  const handleNavClick = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'chat') markChatRead();
  };

  return (
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
        onClick={async () => {
          if (editorMode === 'edit') {
            setEditorMode('view');
            return;
          }
          if (isFloorOwner) {
            setEditorMode('edit');
            return;
          }
          // Not yet authenticated - ask for owner password
          const pw = prompt('管理者パスワードを入力してください');
          if (!pw) return;
          try {
            const slug = window.location.pathname.split('/f/')[1];
            const res = await fetch(`/api/floors/${slug}/verify-owner`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ownerPassword: pw }),
            });
            const data = await res.json();
            if (data.canEdit) {
              useOfficeStore.getState().setIsFloorOwner(true);
              sessionStorage.setItem(`ethereal-owner-${slug}`, 'true');
              sessionStorage.setItem(`ethereal-owner-pw-${slug}`, pw);
              setEditorMode('edit');
            } else {
              useOfficeStore.getState().addNotification('パスワードが正しくありません');
            }
          } catch {
            useOfficeStore.getState().addNotification('認証に失敗しました');
          }
        }}
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
  );
}
