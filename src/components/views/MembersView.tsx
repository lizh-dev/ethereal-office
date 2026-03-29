'use client';

import { useMemo } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import { getAvatarUrl } from '@/components/floor/assets';

const STATUS_COLORS: Record<string, string> = {
  online: '#4CAF50', busy: '#F44336', focusing: '#FF9800', offline: '#BDBDBD',
};
const STATUS_LABELS: Record<string, string> = {
  online: 'オンライン', busy: 'ビジー', focusing: '集中モード', offline: 'オフライン',
};

export default function MembersView() {
  const { currentUser, users, searchQuery, isFloorOwner } = useOfficeStore();

  const handleKick = (userId: string, userName: string) => {
    if (!confirm(`${userName} をフロアから退出させますか？`)) return;
    const wsSend = (window as unknown as Record<string, any>).__wsSend;
    wsSend?.kick?.(userId);
  };

  const allUsers = useMemo(() => {
    const all = [currentUser, ...users];
    if (!searchQuery.trim()) return all;
    const q = searchQuery.trim().toLowerCase();
    return all.filter(u => u.name.toLowerCase().includes(q));
  }, [currentUser, users, searchQuery]);

  const onlineUsers = allUsers.filter(u => u.status !== 'offline');
  // Deduplicate offline users by name (stale connections may leave duplicates)
  const offlineRaw = allUsers.filter(u => u.status === 'offline');
  const offlineNames = new Set<string>();
  const offlineUsers = offlineRaw.filter(u => {
    if (offlineNames.has(u.name)) return false;
    offlineNames.add(u.name);
    return true;
  });

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
      {/* Header */}
      <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4">
        <h2 className="text-sm font-semibold text-gray-700">👥 メンバー</h2>
        <span className="ml-2 text-xs text-gray-400">{onlineUsers.length}人がオンライン</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Online */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            オンライン ({onlineUsers.length})
          </h3>
          <div className="space-y-1">
            {onlineUsers.map(user => (
              <div key={user.id} className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-xl hover:bg-gray-50 transition-colors">
                <div className="relative flex-shrink-0">
                  <img
                    src={getAvatarUrl(user.avatarSeed || 'default', user.avatarStyle || 'notionists')}
                    alt=""
                    className="w-9 h-9 rounded-full border-2"
                    style={{ borderColor: STATUS_COLORS[user.status] || '#BDBDBD' }}
                  />
                  <div
                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
                    style={{ backgroundColor: STATUS_COLORS[user.status] || '#BDBDBD' }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">
                    {user.name}
                    {user.id === currentUser.id && <span className="text-gray-400 text-xs ml-1">(自分)</span>}
                  </div>
                  <div className="text-xs text-gray-400">{STATUS_LABELS[user.status] || user.status}</div>
                </div>
                {isFloorOwner && user.id !== currentUser.id && (
                  <button
                    onClick={() => handleKick(user.id, user.name)}
                    className="text-[10px] px-2 py-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                    title={`${user.name} を退出させる`}
                  >
                    退出
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Offline */}
        {offlineUsers.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              オフライン ({offlineUsers.length})
            </h3>
            <div className="space-y-1">
              {offlineUsers.map(user => (
                <div key={user.id} className="flex items-center gap-3 px-3 py-2.5 bg-white/50 rounded-xl opacity-60">
                  <img
                    src={getAvatarUrl(user.avatarSeed || 'default', user.avatarStyle || 'notionists')}
                    alt=""
                    className="w-9 h-9 rounded-full border-2 border-gray-200 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-600 truncate">{user.name}</div>
                    <div className="text-xs text-gray-400">オフライン</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {allUsers.length === 0 && (
          <div className="text-center text-gray-400 text-sm mt-10">
            メンバーが見つかりません
          </div>
        )}
      </div>
    </div>
  );
}
