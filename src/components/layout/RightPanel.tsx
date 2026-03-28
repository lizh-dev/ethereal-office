'use client';

import { useOfficeStore } from '@/store/officeStore';
import { activeMeetings } from '@/data/floorPlan';
import { getAvatarUrl } from '@/components/floor/assets';

const STATUS_COLORS: Record<string, string> = {
  online: '#4CAF50', busy: '#F44336', focusing: '#FF9800', offline: '#BDBDBD',
};

export default function RightPanel() {
  const { users, currentUser } = useOfficeStore();
  const allUsers = [currentUser, ...users];
  const onlineUsers = allUsers.filter(u => u.status !== 'offline');

  return (
    <aside className="w-[230px] bg-white border-l border-gray-200 flex flex-col h-full overflow-y-auto">
      <div className="p-3 pb-2">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">オンラインメンバー</h3>
          <button className="text-gray-400 hover:text-gray-600 text-xs">«</button>
        </div>
        <div className="space-y-0.5">
          {onlineUsers.map((user) => (
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
                <div className="text-[9px] truncate leading-tight" style={{ color: STATUS_COLORS[user.status] }}>{user.role}</div>
              </div>
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[user.status] }} />
            </div>
          ))}
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
