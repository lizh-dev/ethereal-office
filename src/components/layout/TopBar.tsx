'use client';

import { useOfficeStore } from '@/store/officeStore';
import { getAvatarUrl } from '@/components/floor/assets';

const STATUS_COLORS: Record<string, string> = {
  online: '#4CAF50', busy: '#F44336', focusing: '#FF9800', offline: '#9CA3AF',
};
const STATUS_LABELS: Record<string, string> = {
  online: 'オンライン', busy: 'ビジー', focusing: '集中中', offline: 'オフライン',
};

export default function TopBar() {
  const { currentUser, editorMode, exportFloorPlan, setShowAvatarSelector } = useOfficeStore();

  const handleExport = () => {
    const json = exportFloorPlan();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'floorplan.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <header className="h-[50px] bg-white border-b border-gray-200 flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <span className="text-base font-bold text-gray-800 flex items-center gap-2">
          <span className="text-blue-600">W</span> WorkMap
        </span>
        {editorMode === 'edit' && (
          <span className="text-[11px] px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full font-medium border border-amber-200">
            ✏️ 編集モード
          </span>
        )}
      </div>

      <div className="flex-1 max-w-md mx-6">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input type="text" placeholder="メンバー、部屋、タグを検索..."
            className="w-full h-9 pl-9 pr-4 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-600 placeholder:text-gray-400 focus:outline-none focus:border-blue-300 focus:bg-white transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {editorMode === 'edit' && (
          <button onClick={handleExport} className="text-[11px] px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-600 transition-colors">
            JSONエクスポート
          </button>
        )}
        <button className="w-8 h-8 rounded-lg hover:bg-gray-50 flex items-center justify-center text-gray-400 relative transition-colors">
          💬
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center border border-white">1</span>
        </button>
        <button className="w-8 h-8 rounded-lg hover:bg-gray-50 flex items-center justify-center text-gray-400 relative transition-colors">
          🔔
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center border border-white">3</span>
        </button>

        {/* User - click to change avatar */}
        <button
          onClick={() => setShowAvatarSelector(true)}
          className="flex items-center gap-2 pl-3 border-l border-gray-200 hover:bg-gray-50 rounded-lg pr-2 py-1 transition-colors"
        >
          <div className="relative">
            <img
              src={getAvatarUrl(currentUser.avatarSeed || currentUser.name, currentUser.avatarStyle || 'notionists')}
              alt="" className="w-9 h-9 rounded-full bg-gray-100 border-2"
              style={{ borderColor: STATUS_COLORS[currentUser.status] }}
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white" style={{ background: STATUS_COLORS[currentUser.status] }} />
          </div>
          <div className="text-left">
            <div className="text-[12px] font-semibold text-gray-800">{currentUser.name}</div>
            <div className="text-[10px] font-medium" style={{ color: STATUS_COLORS[currentUser.status] }}>{STATUS_LABELS[currentUser.status]}</div>
          </div>
          <span className="text-gray-400 text-xs ml-1">▾</span>
        </button>
      </div>
    </header>
  );
}
