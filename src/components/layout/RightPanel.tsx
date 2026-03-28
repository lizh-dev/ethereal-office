'use client';

import { useMemo } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import { activeMeetings } from '@/data/floorPlan';
import { getAvatarUrl } from '@/components/floor/assets';
import type { UserAction } from '@/types';

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

export default function RightPanel() {
  const { users, currentUser, zones, currentAction, currentSeatId } = useOfficeStore();
  const allUsers = [currentUser, ...users];
  const onlineUsers = allUsers.filter(u => u.status !== 'offline');

  // Build maps of userId -> zone name and userId -> action
  const userInfo = useMemo(() => {
    const zoneMap: Record<string, string> = {};
    const actionMap: Record<string, UserAction> = {};
    const actionByZoneType: Record<string, UserAction> = {
      desk: 'working',
      meeting: 'meeting',
      lounge: 'break',
      cafe: 'break',
      open: 'idle',
    };
    for (const zone of zones) {
      for (const seat of zone.seats) {
        if (seat.occupied && seat.occupiedBy) {
          zoneMap[seat.occupiedBy] = zone.name;
          actionMap[seat.occupiedBy] = actionByZoneType[zone.type] || 'idle';
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
    return { zoneMap, actionMap };
  }, [zones, currentSeatId, currentAction, currentUser.id]);

  return (
    <aside className="w-[230px] bg-white border-l border-gray-200 flex flex-col h-full overflow-y-auto">
      <div className="p-3 pb-2">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">オンラインメンバー</h3>
          <button className="text-gray-400 hover:text-gray-600 text-xs">&laquo;</button>
        </div>
        <div className="space-y-0.5">
          {onlineUsers.map((user) => {
            const userAction = userInfo.actionMap[user.id] || 'idle';
            const userZone = userInfo.zoneMap[user.id];
            const emoji = ACTION_EMOJI[userAction];
            return (
              <div key={user.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="relative flex-shrink-0">
                  <img
                    src={getAvatarUrl(user.avatarSeed || user.name, user.avatarStyle || 'notionists')}
                    alt={user.name}
                    className="w-[30px] h-[30px] rounded-full bg-gray-100"
                    style={{ border: `2px solid ${STATUS_COLORS[user.status]}` }}
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-[1.5px] border-white" style={{ background: STATUS_COLORS[user.status] }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold text-gray-800 truncate leading-tight">{user.name}</div>
                  <div className="flex items-center gap-1">
                    {emoji && <span className="text-[10px]">{emoji}</span>}
                    <span className="text-[9px] truncate leading-tight" style={{ color: STATUS_COLORS[user.status] }}>
                      {userAction !== 'idle' ? ACTION_LABELS[userAction] : user.role}
                    </span>
                  </div>
                  {userZone && (
                    <div className="text-[8px] text-gray-400 truncate leading-tight">
                      {userZone}
                    </div>
                  )}
                </div>
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[user.status] }} />
              </div>
            );
          })}
        </div>
      </div>
      <div className="mx-3 border-t border-gray-100 my-1.5" />
      <div className="p-3 pt-1.5">
        <h3 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">アクティブミーティング</h3>
        <div className="space-y-1.5">
          {activeMeetings.map((meeting) => (
            <div key={meeting.roomId} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer border border-gray-100">
              <div className="w-7 h-7 rounded-md flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ background: meeting.color }}>📹</div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-semibold text-gray-800 truncate">{meeting.name}</div>
                <div className="text-[9px] text-gray-500">{meeting.time}</div>
              </div>
              <div className="flex -space-x-1.5">
                {users.slice(0, 3).map((u) => (
                  <img key={u.id} src={getAvatarUrl(u.avatarSeed || u.name, u.avatarStyle || 'notionists')} alt="" className="w-[18px] h-[18px] rounded-full border border-white bg-gray-100" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
