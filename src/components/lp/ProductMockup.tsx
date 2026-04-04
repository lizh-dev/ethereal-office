'use client';

import { useEffect, useState } from 'react';
import { Building2, Users, Video, MessageCircle, Settings } from 'lucide-react';

// DiceBear avatar URL helper
function avatar(seed: string, style: string = 'notionists') {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&radius=50`;
}

// ---------- Data ----------
const DEMO_USERS = [
  { name: '田中太郎', seed: '田中', style: 'lorelei', status: 'online' as const, seat: 'dev-1', statusMsg: '' },
  { name: '佐藤花子', seed: '佐藤', style: 'avataaars', status: 'online' as const, seat: 'dev-3', statusMsg: '' },
  { name: '鈴木一郎', seed: '鈴木', style: 'big-smile', status: 'focusing' as const, seat: 'dev-5', statusMsg: 'コーディング中' },
  { name: '高橋美咲', seed: '高橋', style: 'adventurer', status: 'online' as const, seat: 'dev-2', statusMsg: '' },
  { name: '伊藤健太', seed: '伊藤', style: 'personas', status: 'busy' as const, seat: 'mtg-1', statusMsg: 'ミーティング中' },
  { name: '渡辺さくら', seed: '渡辺', style: 'notionists', status: 'online' as const, seat: 'mtg-2', statusMsg: '' },
  { name: '山本翔太', seed: '山本', style: 'lorelei', status: 'online' as const, seat: 'cafe-1', statusMsg: '' },
  { name: '中村りん', seed: 'rin', style: 'avataaars', status: 'online' as const, seat: 'dev-4', statusMsg: '' },
];

const STATUS_COLORS: Record<string, string> = {
  online: '#22C55E',
  busy: '#EF4444',
  focusing: '#F59E0B',
  offline: '#9CA3AF',
};

// ---------- Browser Frame ----------
function BrowserFrame({ children, url = 'app.example.com/f/my-team', className = '' }: {
  children: React.ReactNode;
  url?: string;
  className?: string;
}) {
  return (
    <div className={`rounded-xl overflow-hidden shadow-2xl border border-gray-200/60 bg-white ${className}`}>
      {/* Title bar */}
      <div className="h-9 bg-gray-100 border-b border-gray-200 flex items-center px-3 gap-2 shrink-0">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
          <div className="w-3 h-3 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-1.5 px-4 py-1 bg-white rounded-md border border-gray-200 text-[11px] text-gray-400 max-w-[280px] w-full">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" className="text-gray-300 shrink-0">
              <path d="M8 1a5 5 0 00-5 5v1H2a1 1 0 00-1 1v6a1 1 0 001 1h12a1 1 0 001-1V8a1 1 0 00-1-1h-1V6a5 5 0 00-5-5z" fill="currentColor" opacity="0.5" />
            </svg>
            <span className="truncate">{url}</span>
          </div>
        </div>
        <div className="w-12" />
      </div>
      {/* Content */}
      <div className="relative overflow-hidden">
        {children}
      </div>
    </div>
  );
}

// ---------- Avatar Component ----------
function UserAvatar({ user, size = 32, showName = true, showStatus = true, animate = false }: {
  user: typeof DEMO_USERS[0];
  size?: number;
  showName?: boolean;
  showStatus?: boolean;
  animate?: boolean;
}) {
  const borderColor = STATUS_COLORS[user.status] || STATUS_COLORS.online;
  return (
    <div className={`flex flex-col items-center gap-0.5 ${animate ? 'animate-float-gentle' : ''}`}>
      <div className="relative">
        <div
          className="rounded-full border-2 overflow-hidden bg-white shadow-sm"
          style={{ width: size, height: size, borderColor }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatar(user.seed, user.style)} alt={user.name} width={size} height={size} className="block" />
        </div>
        {showStatus && (
          <div
            className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white"
            style={{ width: size * 0.3, height: size * 0.3, backgroundColor: borderColor }}
          />
        )}
      </div>
      {showName && (
        <span className="text-[9px] font-medium text-gray-600 whitespace-nowrap leading-none mt-0.5">{user.name}</span>
      )}
    </div>
  );
}

// ---------- Desk Space ----------
function DeskIcon({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="w-[52px] h-[32px] bg-amber-100 border border-amber-300 rounded-md shadow-sm flex items-center justify-center">
        <div className="w-[20px] h-[14px] bg-gray-700 rounded-sm border border-gray-800" />
      </div>
    </div>
  );
}

// ---------- Main Mockup: Office View ----------
export function OfficeMockup({ className = '' }: { className?: string }) {
  const [chatBubble, setChatBubble] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setChatBubble(prev => !prev), 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <BrowserFrame className={className}>
      <div className="relative bg-gradient-to-br from-sky-50/80 via-white to-blue-50/60" style={{ height: 520 }}>
        {/* Top bar */}
        <div className="h-11 bg-white border-b border-gray-100 flex items-center px-5 gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">S</span>
          </div>
          <span className="text-xs font-semibold text-gray-800">開発チーム</span>
          <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100 flex-1 max-w-[200px] ml-4">
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" className="text-gray-300">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" />
              <path d="M13 13l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="text-[11px] text-gray-300">メンバーを検索...</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <UserAvatar user={DEMO_USERS[0]} size={28} showName={false} showStatus={false} />
            <div className="text-xs">
              <div className="font-semibold text-gray-700">田中太郎</div>
              <div className="text-[10px] text-green-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />オンライン
              </div>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(100%-11px)]">
          {/* Sidebar */}
          <div className="w-12 bg-gray-50/80 border-r border-gray-100 flex flex-col items-center pt-4 gap-3">
            {[Building2, Users, Video, MessageCircle, Settings].map((Icon, i) => (
              <div key={i} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                i === 0 ? 'bg-sky-100 text-sky-600' : 'text-gray-400'
              }`}>
                <Icon className="w-4 h-4" strokeWidth={1.8} />
              </div>
            ))}
          </div>

          {/* Floor canvas */}
          <div className="relative flex-1 p-8">
            {/* Grid background */}
            <div className="absolute inset-0 opacity-[0.03]"
              style={{ backgroundImage: 'radial-gradient(circle, #000 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}
            />

            {/* Development Team Zone */}
            <div className="absolute left-8 top-6 bg-white/90 rounded-2xl border border-gray-200/80 shadow-sm px-6 py-5" style={{ width: 300 }}>
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-4">開発チーム</div>
              <div className="grid grid-cols-3 gap-x-6 gap-y-5">
                {DEMO_USERS.filter(u => u.seat.startsWith('dev-')).slice(0, 3).map((user, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <UserAvatar user={user} size={34} animate={user.status === 'online'} />
                    <DeskIcon />
                  </div>
                ))}
                {DEMO_USERS.filter(u => u.seat.startsWith('dev-')).slice(3, 5).map((user, i) => (
                  <div key={i+3} className="flex flex-col items-center gap-1.5">
                    <DeskIcon />
                    <UserAvatar user={user} size={34} animate={user.status === 'online'} />
                  </div>
                ))}
                <div className="flex flex-col items-center gap-1.5">
                  <DeskIcon />
                  <div className="w-[34px] h-[34px] rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center">
                    <span className="text-gray-300 text-[9px]">空</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Meeting Room Zone */}
            <div className="absolute right-6 top-6 bg-white/90 rounded-2xl border border-gray-200/80 shadow-sm px-6 py-5" style={{ width: 220 }}>
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                ミーティングルーム
              </div>
              <div className="flex items-center justify-center gap-6 py-3">
                <div className="flex flex-col items-center gap-2">
                  {DEMO_USERS.filter(u => u.seat.startsWith('mtg-')).map((user, i) => (
                    <UserAvatar key={i} user={user} size={30} />
                  ))}
                </div>
                <div className="w-20 h-12 bg-amber-50 rounded-xl border border-amber-200/60 flex items-center justify-center">
                  <span className="text-[9px] text-amber-400 font-medium">TABLE</span>
                </div>
              </div>
              {chatBubble && (
                <div className="absolute -bottom-9 left-5 bg-white rounded-lg border border-gray-200 shadow-lg px-3 py-1.5 text-[10px] text-gray-600 animate-fade-in-up">
                  💬 この機能のレビューお願いします
                </div>
              )}
            </div>

            {/* Café Zone */}
            <div className="absolute left-8 bottom-16 bg-white/90 rounded-2xl border border-gray-200/80 shadow-sm px-6 py-5" style={{ width: 180 }}>
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <span>☕</span> カフェスペース
              </div>
              <div className="flex items-center gap-4">
                <UserAvatar user={DEMO_USERS[6]} size={30} />
                <div className="flex gap-2">
                  <div className="w-10 h-10 bg-amber-50 rounded-full border border-amber-200/60" />
                  <div className="w-10 h-10 bg-amber-50 rounded-full border border-amber-200/60" />
                </div>
              </div>
            </div>

            {/* Status indicator */}
            <div className="absolute right-8 bottom-16 bg-amber-50 rounded-xl border border-amber-200/60 px-4 py-3 flex items-center gap-3">
              <span className="text-base">🎯</span>
              <div>
                <div className="text-[11px] font-bold text-amber-700">鈴木一郎 - 取込中</div>
                <div className="text-[10px] text-amber-500">あと 18:42</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom action bar */}
        <div className="absolute bottom-0 left-12 right-0 h-12 bg-white/90 border-t border-gray-100 flex items-center justify-center gap-3 px-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
            </div>
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">📝</div>
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">😊</div>
          </div>
          <div className="flex-1 max-w-xs h-8 bg-gray-50 rounded-lg border border-gray-200 flex items-center px-3">
            <span className="text-[11px] text-gray-300">メッセージ...</span>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

// ---------- Voice Proximity Mockup ----------
export function MeetingMockup({ className = '' }: { className?: string }) {
  return (
    <BrowserFrame className={className} url="app.example.com/meeting/standup">
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" style={{ height: 420 }}>
        {/* Meeting header */}
        <div className="absolute top-0 left-0 right-0 h-10 bg-gray-900/80 border-b border-gray-700 flex items-center px-4">
          <div className="text-xs text-gray-300 font-medium">デイリースタンドアップ</div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] text-gray-500">3人参加中</span>
          </div>
        </div>

        {/* Video grid */}
        <div className="absolute inset-0 top-10 bottom-14 p-3 grid grid-cols-2 gap-2">
          {/* Participant 1 - speaking */}
          <div className="relative rounded-lg bg-gray-700 border-2 border-sky-400 overflow-hidden flex items-center justify-center">
            <UserAvatar user={DEMO_USERS[0]} size={56} showName={false} />
            <div className="absolute bottom-2 left-2 bg-black/60 rounded-md px-2 py-1">
              <span className="text-[10px] text-white font-medium">{DEMO_USERS[0].name}</span>
            </div>
            <div className="absolute top-2 right-2 w-5 h-5 bg-sky-500/20 rounded-full flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-sky-400 rounded-full animate-pulse" />
            </div>
          </div>

          {/* Participant 2 */}
          <div className="relative rounded-lg bg-gray-700 border border-gray-600 overflow-hidden flex items-center justify-center">
            <UserAvatar user={DEMO_USERS[1]} size={56} showName={false} />
            <div className="absolute bottom-2 left-2 bg-black/60 rounded-md px-2 py-1">
              <span className="text-[10px] text-white font-medium">{DEMO_USERS[1].name}</span>
            </div>
          </div>

          {/* Participant 3 - screen sharing */}
          <div className="relative rounded-lg bg-gray-800 border border-gray-600 overflow-hidden col-span-2 flex items-center justify-center">
            <div className="w-[90%] h-[80%] bg-white/5 rounded-md border border-gray-600/50 flex items-center justify-center">
              <div className="text-center">
                <div className="text-[11px] text-gray-400 mb-1">{DEMO_USERS[3].name} の画面</div>
                <div className="w-48 h-12 bg-white/10 rounded border border-gray-600/30 mx-auto" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom toolbar */}
        <div className="absolute bottom-0 left-0 right-0 h-14 bg-gray-900/90 border-t border-gray-700 flex items-center justify-center gap-2.5">
          <div className="bg-gray-700 rounded-full w-9 h-9 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/></svg>
          </div>
          <div className="bg-gray-700 rounded-full w-9 h-9 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
          </div>
          <div className="bg-gray-700 rounded-full w-9 h-9 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          </div>
          <div className="bg-gray-700 rounded-full w-9 h-9 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          </div>
          <div className="bg-red-600 rounded-full w-9 h-9 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" transform="rotate(135 12 12)"/></svg>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

// ---------- Chat Mockup ----------
export function ChatMockup({ className = '' }: { className?: string }) {
  return (
    <BrowserFrame className={className} url="app.example.com/f/my-team">
      <div className="relative bg-white" style={{ height: 420 }}>
        {/* Top bar */}
        <div className="h-10 bg-white border-b border-gray-100 flex items-center px-4">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">S</span>
          </div>
          <div className="text-xs text-gray-800 font-semibold ml-2">開発チーム</div>
          <div className="ml-auto flex items-center gap-1 text-[10px] text-gray-400">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            6人オンライン
          </div>
        </div>

        <div className="flex h-[calc(100%-40px)]">
          {/* Sidebar tabs */}
          <div className="w-11 bg-gray-50 border-r border-gray-100 flex flex-col items-center pt-3 gap-3">
            {[Building2, Users, Video, MessageCircle].map((Icon, i) => (
              <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                i === 3 ? 'bg-sky-100 text-sky-600' : 'text-gray-400 hover:bg-gray-100'
              }`}>
                <Icon className="w-4 h-4" strokeWidth={1.8} />
              </div>
            ))}
          </div>

          {/* Chat area */}
          <div className="flex-1 flex flex-col">
            {/* Chat tabs */}
            <div className="flex border-b border-gray-100 px-3">
              <button className="px-3 py-2 text-[11px] font-medium text-sky-600 border-b-2 border-sky-500">全体チャット</button>
              <button className="px-3 py-2 text-[11px] font-medium text-gray-400 relative">
                DM
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 text-white text-[7px] rounded-full flex items-center justify-center font-bold">2</span>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden px-3 py-2 space-y-3">
              {/* Message from others */}
              <div className="flex gap-2">
                <UserAvatar user={DEMO_USERS[1]} size={24} showName={false} />
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] font-semibold text-gray-800">{DEMO_USERS[1].name}</span>
                    <span className="text-[9px] text-gray-400">10:23</span>
                  </div>
                  <div className="mt-0.5 bg-gray-100 rounded-lg rounded-tl-none px-2.5 py-1.5 text-[11px] text-gray-700 max-w-[220px]">
                    デプロイの件、確認できました！
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <UserAvatar user={DEMO_USERS[3]} size={24} showName={false} />
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] font-semibold text-gray-800">{DEMO_USERS[3].name}</span>
                    <span className="text-[9px] text-gray-400">10:25</span>
                  </div>
                  <div className="mt-0.5 bg-gray-100 rounded-lg rounded-tl-none px-2.5 py-1.5 text-[11px] text-gray-700 max-w-[220px]">
                    ありがとうございます。レビューお願いします
                  </div>
                </div>
              </div>

              {/* Own message */}
              <div className="flex justify-end">
                <div>
                  <div className="flex items-baseline gap-2 justify-end">
                    <span className="text-[9px] text-gray-400">10:26</span>
                  </div>
                  <div className="mt-0.5 bg-sky-500 rounded-lg rounded-tr-none px-2.5 py-1.5 text-[11px] text-white max-w-[220px]">
                    了解！午後に見ますね
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <UserAvatar user={DEMO_USERS[6]} size={24} showName={false} />
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] font-semibold text-gray-800">{DEMO_USERS[6].name}</span>
                    <span className="text-[9px] text-gray-400">10:30</span>
                  </div>
                  <div className="mt-0.5 bg-gray-100 rounded-lg rounded-tl-none px-2.5 py-1.5 text-[11px] text-gray-700 max-w-[220px]">
                    お疲れさまです！カフェスペースにいるので、相談ある方はどうぞ〜
                  </div>
                </div>
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-gray-100 px-3 py-2">
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg border border-gray-200 px-3 py-2">
                <span className="text-[11px] text-gray-400 flex-1">メッセージを入力...</span>
                <div className="w-6 h-6 bg-sky-500 rounded-md flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </div>
              </div>
            </div>
          </div>

          {/* DM panel (floating) */}
          <div className="w-48 border-l border-gray-100 bg-white flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
              <div className="flex items-center gap-1.5">
                <UserAvatar user={DEMO_USERS[2]} size={20} showName={false} />
                <span className="text-[10px] font-semibold text-gray-800">{DEMO_USERS[2].name}</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full">取込中</span>
            </div>
            <div className="flex-1 px-2 py-2 space-y-2">
              <div className="bg-gray-100 rounded-lg rounded-tl-none px-2 py-1 text-[10px] text-gray-700 max-w-[140px]">
                午後のミーティング、15時に変更できますか？
              </div>
              <div className="flex justify-end">
                <div className="bg-sky-500 rounded-lg rounded-tr-none px-2 py-1 text-[10px] text-white max-w-[140px]">
                  大丈夫です！
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}
