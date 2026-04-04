'use client';

import { useMemo, useCallback } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import { resolveAvatarUrl } from '@/components/floor/assets';
import { useWsSend } from '@/contexts/WebSocketContext';
import type { UserAction, User, Zone } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  online: '#4CAF50', busy: '#F44336', focusing: '#FF9800', offline: '#BDBDBD',
};

const ACTION_EMOJI: Record<UserAction, string> = {
  working: '\uD83D\uDCBB',
  meeting: '\uD83E\uDD1D',
  break: '\u2615',
  away: '\uD83D\uDCA4',
  idle: '',
};

const ACTION_LABELS: Record<UserAction, string> = {
  working: '作業中',
  meeting: 'ミーティング',
  break: '休憩中',
  away: '離席中',
  idle: 'フリー',
};

function UserRow({ user, action, zoneName, onClickUser }: {
  user: User;
  action: UserAction;
  zoneName?: string;
  onClickUser: (user: User) => void;
}) {
  const emoji = ACTION_EMOJI[action];
  return (
    <div
      onClick={() => onClickUser(user)}
      className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
    >
      <div className="relative flex-shrink-0">
        <img
          src={resolveAvatarUrl(user)}
          alt={user.name}
          className="w-[28px] h-[28px] rounded-full bg-gray-100"
          style={{ border: `2px solid ${STATUS_COLORS[user.status]}` }}
        />
        <div
          className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-[1.5px] border-white"
          style={{ background: STATUS_COLORS[user.status] }}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold text-gray-800 truncate leading-tight">{user.name}</div>
        <div className="flex items-center gap-1">
          {emoji && <span className="text-[10px]">{emoji}</span>}
          <span className="text-[9px] truncate leading-tight" style={{ color: STATUS_COLORS[user.status] }}>
            {action !== 'idle' ? ACTION_LABELS[action] : user.role || 'フリー'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function RightPanel() {
  const {
    users, currentUser, zones, currentAction, currentSeatId,
    excalidrawAPI, standUp, sitAt, addNotification, searchQuery,
  } = useOfficeStore();
  const wsSend = useWsSend();

  const allUsers = useMemo(() => [currentUser, ...users], [currentUser, users]);
  const onlineUsers = useMemo(() => {
    const online = allUsers.filter(u => u.status !== 'offline');
    if (!searchQuery.trim()) return online;
    const q = searchQuery.trim().toLowerCase();
    return online.filter(u => u.name.toLowerCase().includes(q));
  }, [allUsers, searchQuery]);

  // Build maps of userId -> zone name and userId -> action
  const userInfo = useMemo(() => {
    const zoneMap: Record<string, string> = {};
    const actionMap: Record<string, UserAction> = {};
    const seatPositionMap: Record<string, { x: number; y: number }> = {};
    const actionByZoneType: Record<string, UserAction> = {
      desk: 'working', meeting: 'meeting', lounge: 'break', cafe: 'break', open: 'idle',
    };
    for (const zone of zones) {
      for (const seat of zone.seats) {
        if (seat.occupied && seat.occupiedBy) {
          zoneMap[seat.occupiedBy] = zone.name;
          actionMap[seat.occupiedBy] = actionByZoneType[zone.type] || 'idle';
          seatPositionMap[seat.occupiedBy] = { x: seat.x, y: seat.y };
        }
      }
    }
    // Current user overrides
    if (currentSeatId) {
      actionMap[currentUser.id] = currentAction;
      for (const zone of zones) {
        if (zone.seats.some((s) => s.id === currentSeatId)) {
          zoneMap[currentUser.id] = zone.name;
          break;
        }
      }
    }
    return { zoneMap, actionMap, seatPositionMap };
  }, [zones, currentSeatId, currentAction, currentUser.id]);

  // Group online users by zone
  const groupedUsers = useMemo(() => {
    const groups: Record<string, { users: User[]; action: UserAction }[]> = {};
    for (const user of onlineUsers) {
      const zone = userInfo.zoneMap[user.id] || 'フリー';
      if (!groups[zone]) groups[zone] = [];
      groups[zone].push({ users: [user], action: userInfo.actionMap[user.id] || 'idle' });
    }
    // Sort: seated zones first, then free
    const sorted: { zone: string; members: { user: User; action: UserAction }[] }[] = [];
    const zoneOrder = Object.keys(groups).filter(z => z !== 'フリー');
    for (const z of zoneOrder) {
      sorted.push({ zone: z, members: groups[z].map(g => ({ user: g.users[0], action: g.action })) });
    }
    if (groups['フリー']) {
      sorted.push({ zone: 'フリー', members: groups['フリー'].map(g => ({ user: g.users[0], action: g.action })) });
    }
    return sorted;
  }, [onlineUsers, userInfo]);

  // Active meetings: zones of type "meeting" with 2+ occupied seats
  const activeMeetings = useMemo(() => {
    return zones
      .filter(z => z.type === 'meeting')
      .map(zone => {
        const occupiedSeats = zone.seats.filter(s => s.occupied && s.occupiedBy);
        const participants = occupiedSeats
          .map(s => allUsers.find(u => u.id === s.occupiedBy))
          .filter(Boolean) as User[];
        return { zone, participants };
      })
      .filter(m => m.participants.length >= 2);
  }, [zones, allUsers]);

  // Scroll/pan to user position on canvas
  const handleClickUser = useCallback((user: User) => {
    if (!excalidrawAPI) return;
    const pos = userInfo.seatPositionMap[user.id] || user.position;
    try {
      excalidrawAPI.scrollToContent(undefined, {
        fitToContent: false,
        viewportZoomFactor: 1,
        animate: true,
      });
      // Fallback: manually scroll to position
      const appState = excalidrawAPI.getAppState?.();
      if (appState) {
        const zoom = appState.zoom?.value || 1;
        excalidrawAPI.updateScene({
          appState: {
            scrollX: -pos.x * zoom + window.innerWidth / 3,
            scrollY: -pos.y * zoom + window.innerHeight / 3,
          },
        });
      }
    } catch {
      // Silent fallback
    }
  }, [excalidrawAPI, userInfo.seatPositionMap]);

  // Join meeting: sit at first available seat in that zone
  const handleJoinMeeting = useCallback((zone: Zone) => {
    const availableSeat = zone.seats.find(s => !s.occupied);
    if (availableSeat) {
      sitAt(availableSeat.id);
      wsSend.sit(availableSeat.id, availableSeat.x, availableSeat.y);
    } else {
      addNotification('空席がありません');
    }
  }, [sitAt, addNotification, wsSend]);

  // Current user zone info
  const currentZoneName = userInfo.zoneMap[currentUser.id];
  const currentUserAction = currentSeatId ? currentAction : 'idle';

  return (
    <aside className="w-[230px] bg-white border-l border-gray-200 flex flex-col h-full overflow-y-auto">
      {/* My Status */}
      <div className="p-3 pb-2">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">マイステータス</h3>
        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100">
          <div className="relative flex-shrink-0">
            <img
              src={resolveAvatarUrl(currentUser)}
              alt={currentUser.name}
              className="w-[36px] h-[36px] rounded-full bg-gray-100"
              style={{ border: `2.5px solid ${STATUS_COLORS[currentUser.status]}` }}
            />
            <div
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
              style={{ background: STATUS_COLORS[currentUser.status] }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-bold text-gray-800 truncate">{currentUser.name}</div>
            <div className="flex items-center gap-1">
              {ACTION_EMOJI[currentUserAction] && (
                <span className="text-[10px]">{ACTION_EMOJI[currentUserAction]}</span>
              )}
              <span className="text-[10px] text-gray-600">
                {currentUserAction !== 'idle' ? ACTION_LABELS[currentUserAction] : 'フリー'}
              </span>
            </div>
            {currentZoneName ? (
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[9px] text-indigo-500 font-medium">{currentZoneName}</span>
                <button
                  onClick={() => { standUp(); wsSend.stand(); }}
                  className="text-[8px] px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 transition-colors ml-auto"
                >
                  立ち上がる
                </button>
              </div>
            ) : (
              <div className="text-[9px] text-gray-400 mt-0.5">フリー</div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-3 border-t border-gray-100" />

      {/* Online Members */}
      <div className="p-3 pb-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            オンラインメンバー ({onlineUsers.length})
          </h3>
        </div>
        <div className="space-y-2">
          {groupedUsers.map(({ zone, members }) => (
            <div key={zone}>
              <div className="flex items-center gap-1.5 mb-0.5 px-1">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: zone === 'フリー' ? '#9CA3AF' : '#6366F1',
                  }}
                />
                <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide">
                  {zone}
                </span>
                <span className="text-[8px] text-gray-300 ml-auto">{members.length}</span>
              </div>
              <div className="space-y-0">
                {members.map(({ user, action }) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    action={action}
                    zoneName={zone}
                    onClickUser={handleClickUser}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-3 border-t border-gray-100" />

      {/* Active Meetings */}
      <div className="p-3 pt-2">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
          アクティブミーティング {activeMeetings.length > 0 && `(${activeMeetings.length})`}
        </h3>
        {activeMeetings.length === 0 ? (
          <div className="text-[10px] text-gray-400 text-center py-3">
            現在アクティブなミーティングはありません
          </div>
        ) : (
          <div className="space-y-1.5">
            {activeMeetings.map(({ zone, participants }) => (
              <div
                key={zone.id}
                className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px]">📹</span>
                    <span className="text-[10px] font-semibold text-gray-800">{zone.name}</span>
                  </div>
                  <span className="text-[9px] text-gray-400">{participants.length}人</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-1.5">
                    {participants.slice(0, 5).map((u) => (
                      <img
                        key={u.id}
                        src={resolveAvatarUrl(u)}
                        alt={u.name}
                        title={u.name}
                        className="w-[20px] h-[20px] rounded-full border-[1.5px] border-white bg-gray-100"
                      />
                    ))}
                    {participants.length > 5 && (
                      <div className="w-[20px] h-[20px] rounded-full border-[1.5px] border-white bg-gray-200 flex items-center justify-center text-[8px] text-gray-600 font-bold">
                        +{participants.length - 5}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleJoinMeeting(zone)}
                    className="text-[9px] px-2 py-1 rounded-md bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition-colors"
                  >
                    参加
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
