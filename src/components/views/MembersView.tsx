'use client';

import { useMemo, useState } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import { getAvatarUrl } from '@/components/floor/assets';
import { useWsSend } from '@/contexts/WebSocketContext';
import { Users, Phone, MessageCircle, Ban } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  online: '#4CAF50', busy: '#F44336', focusing: '#FF9800', offline: '#BDBDBD',
};
const STATUS_LABELS: Record<string, string> = {
  online: 'オンライン', busy: 'ビジー', focusing: '集中モード', offline: 'オフライン',
};

export default function MembersView() {
  const { currentUser, users, searchQuery, isFloorOwner, dmUnreadCount, setActiveDM, callRequestStatus, callTargetUserId } = useOfficeStore();
  const wsSend = useWsSend();

  const [kickTarget, setKickTarget] = useState<{ id: string; name: string } | null>(null);

  const doKick = () => {
    if (!kickTarget) return;
    wsSend.kick(kickTarget.id);
    setKickTarget(null);
  };

  const handleCallRequest = (userId: string) => {
    wsSend.callRequest(userId);
    useOfficeStore.getState().setCallTargetUserId(userId);
    useOfficeStore.getState().setCallRequestStatus('pending');
    // Auto-clear pending status after 30 seconds (timeout)
    setTimeout(() => {
      const state = useOfficeStore.getState();
      if (state.callRequestStatus === 'pending' && state.callTargetUserId === userId) {
        useOfficeStore.getState().clearCallRequest();
        useOfficeStore.getState().addNotification('通話リクエストがタイムアウトしました');
      }
    }, 30000);
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
        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><Users className="w-4 h-4" strokeWidth={1.8} /> メンバー</h2>
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
                  <div className="text-xs text-gray-400">
                    {user.statusMessage || STATUS_LABELS[user.status] || user.status}
                  </div>
                </div>
                {user.id !== currentUser.id && (
                  callRequestStatus === 'pending' && callTargetUserId === user.id ? (
                    <span className="text-[11px] text-orange-500 font-medium flex-shrink-0 animate-pulse">
                      発信中...
                    </span>
                  ) : (
                    <button
                      onClick={() => handleCallRequest(user.id)}
                      className="text-[14px] p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors flex-shrink-0"
                      title={`${user.name} に通話リクエスト`}
                      disabled={callRequestStatus === 'pending'}
                    >
                      <Phone className="w-[14px] h-[14px]" strokeWidth={1.8} />
                    </button>
                  )
                )}
                {user.id !== currentUser.id && (
                  <button
                    onClick={() => setActiveDM(user.id)}
                    className="relative text-[14px] p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors flex-shrink-0"
                    title={`${user.name} にDMを送る`}
                  >
                    <MessageCircle className="w-[14px] h-[14px]" strokeWidth={1.8} />
                    {(dmUnreadCount[user.id] || 0) > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {dmUnreadCount[user.id]}
                      </span>
                    )}
                  </button>
                )}
                {isFloorOwner && user.id !== currentUser.id && (
                  <button
                    onClick={() => setKickTarget({ id: user.id, name: user.name })}
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

      {/* Kick confirmation modal */}
      {kickTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]" onClick={() => setKickTarget(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-xs w-full mx-4 text-center" onClick={e => e.stopPropagation()}>
            <div className="text-3xl mb-3 flex justify-center"><Ban className="w-8 h-8 text-red-500" strokeWidth={1.8} /></div>
            <p className="text-sm font-semibold text-gray-800 mb-1">{kickTarget.name} を退出させますか？</p>
            <p className="text-xs text-gray-500 mb-4">退出させるとフロアから即座に切断されます</p>
            <div className="flex gap-2">
              <button onClick={() => setKickTarget(null)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl text-sm">
                キャンセル
              </button>
              <button onClick={doKick} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl text-sm">
                退出させる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
