'use client';

import { useOfficeStore } from '@/store/officeStore';
import { ViewMode } from '@/types';

const navItems: { mode: ViewMode; label: string; icon: string }[] = [
  { mode: 'floor', label: 'FLOORS', icon: '⊞' },
  { mode: 'meetings', label: 'PEOPLE', icon: '👥' },
  { mode: 'chat', label: 'SCHEDULE', icon: '📅' },
  { mode: 'profile', label: 'SETTINGS', icon: '⚙️' },
];

export default function Sidebar() {
  const { viewMode, setViewMode, editorMode, setEditorMode } = useOfficeStore();

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
            onClick={() => setViewMode(item.mode)}
            className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all text-[18px] ${
              viewMode === item.mode
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
            }`}
            title={item.label}
          >
            <span>{item.icon}</span>
            <span className="text-[7px] font-semibold tracking-wide">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Edit mode */}
      <button
        onClick={() => setEditorMode(editorMode === 'view' ? 'edit' : 'view')}
        className={`w-11 h-11 rounded-xl flex items-center justify-center mb-2 transition-all ${
          editorMode === 'edit'
            ? 'bg-amber-100 text-amber-600'
            : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
        }`}
        title={editorMode === 'edit' ? 'Exit Editor' : 'Edit Floor'}
      >
        <span className="text-lg">✏️</span>
      </button>

      {/* Chat */}
      <button className="w-11 h-11 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all" title="Chats">
        <span className="text-lg">💬</span>
      </button>
    </aside>
  );
}
