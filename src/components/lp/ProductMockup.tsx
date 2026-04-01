'use client';

import { useEffect, useState } from 'react';

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
function BrowserFrame({ children, url = 'smartoffice.app/f/my-team', className = '' }: {
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
      <div className="relative bg-gradient-to-br from-sky-50/80 via-white to-blue-50/60" style={{ height: 420 }}>
        {/* Top bar */}
        <div className="h-10 bg-white border-b border-gray-100 flex items-center px-4 gap-3">
          <div className="text-sm font-bold text-gray-800">S</div>
          <div className="flex items-center gap-1 px-3 py-1 bg-gray-50 rounded-lg border border-gray-100 flex-1 max-w-xs">
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

        {/* Floor canvas area */}
        <div className="relative p-6" style={{ height: 370 }}>
          {/* Grid background */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'radial-gradient(circle, #000 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }}
          />

          {/* Development Team Zone */}
          <div className="absolute left-6 top-4 bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3" style={{ width: 280 }}>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">開発チーム</div>
            <div className="grid grid-cols-3 gap-x-4 gap-y-3">
              {/* Row 1 - with desks */}
              {DEMO_USERS.filter(u => u.seat.startsWith('dev-')).slice(0, 3).map((user, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <UserAvatar user={user} size={30} animate={user.status === 'online'} />
                  <DeskIcon />
                </div>
              ))}
              {/* Row 2 */}
              {DEMO_USERS.filter(u => u.seat.startsWith('dev-')).slice(3, 5).map((user, i) => (
                <div key={i+3} className="flex flex-col items-center gap-1">
                  <DeskIcon />
                  <UserAvatar user={user} size={30} animate={user.status === 'online'} />
                </div>
              ))}
              {/* Empty desk */}
              <div className="flex flex-col items-center gap-1">
                <DeskIcon />
                <div className="w-[30px] h-[30px] rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center">
                  <span className="text-gray-300 text-[8px]">空</span>
                </div>
              </div>
            </div>
          </div>

          {/* Meeting Room Zone */}
          <div className="absolute right-4 top-4 bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3" style={{ width: 200 }}>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
              <span className="text-amber-500">🤝</span> ミーティングルーム
            </div>
            <div className="flex items-center justify-center gap-6 py-2">
              <div className="flex flex-col items-center gap-1">
                {DEMO_USERS.filter(u => u.seat.startsWith('mtg-')).map((user, i) => (
                  <UserAvatar key={i} user={user} size={28} />
                ))}
              </div>
              <div className="w-16 h-10 bg-amber-50 rounded-lg border border-amber-200 flex items-center justify-center">
                <span className="text-[8px] text-amber-400">TABLE</span>
              </div>
            </div>
            {/* Chat bubble */}
            {chatBubble && (
              <div className="absolute -bottom-8 left-4 bg-white rounded-lg border border-gray-200 shadow-md px-2 py-1 text-[9px] text-gray-600 animate-fade-in-up">
                💬 この機能のレビューお願いします
              </div>
            )}
          </div>

          {/* Café Zone */}
          <div className="absolute left-6 bottom-4 bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3" style={{ width: 160 }}>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <span>☕</span> カフェスペース
            </div>
            <div className="flex items-center gap-3">
              <UserAvatar user={DEMO_USERS[6]} size={26} />
              <div className="flex flex-col gap-1">
                <div className="w-8 h-8 bg-amber-50 rounded-full border border-amber-200" />
                <div className="w-8 h-8 bg-amber-50 rounded-full border border-amber-200" />
              </div>
            </div>
          </div>

          {/* Focus indicator for 鈴木一郎 */}
          <div className="absolute right-8 bottom-4 bg-amber-50 rounded-lg border border-amber-200 px-3 py-2 flex items-center gap-2">
            <span className="text-sm">🎯</span>
            <div>
              <div className="text-[10px] font-bold text-amber-700">鈴木一郎 - 取込中</div>
              <div className="text-[9px] text-amber-500">あと 18:42</div>
            </div>
          </div>
        </div>

        {/* Bottom action bar */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-white border-t border-gray-100 flex items-center justify-center gap-2 px-4">
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">●</span>
            </div>
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-sm">🎙</div>
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-sm">🎯</div>
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-sm">😊</div>
          </div>
          <div className="flex-1 flex items-center mx-3">
            <div className="flex-1 h-8 bg-gray-50 rounded-full border border-gray-200 flex items-center px-3">
              <span className="text-[11px] text-gray-300">メッセージ...</span>
            </div>
            <div className="w-7 h-7 bg-gray-50 rounded-full flex items-center justify-center ml-1 text-gray-300 text-xs">▷</div>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

// ---------- Voice Proximity Mockup ----------
export function VoiceMockup({ className = '' }: { className?: string }) {
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setPulse(p => (p + 1) % 3), 1500);
    return () => clearInterval(timer);
  }, []);

  return (
    <BrowserFrame className={className} url="smartoffice.app/f/my-team">
      <div className="relative bg-gradient-to-br from-emerald-50/80 via-white to-green-50/60 flex items-center justify-center" style={{ height: 420 }}>
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 h-10 bg-white border-b border-gray-100 flex items-center px-4">
          <div className="text-sm font-bold text-gray-800">S</div>
          <div className="text-xs text-gray-500 ml-3">近接ボイスチャット</div>
          <div className="ml-auto flex items-center gap-1 px-2 py-0.5 bg-green-50 rounded-full border border-green-200">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] text-green-600 font-medium">接続中</span>
          </div>
        </div>

        {/* Proximity circles */}
        <div className="relative mt-6">
          {/* Outer ring */}
          <div className={`w-64 h-64 rounded-full border-2 border-dashed flex items-center justify-center transition-all duration-1000 ${pulse === 2 ? 'border-green-300 bg-green-50/30' : 'border-gray-200'}`}>
            {/* Middle ring */}
            <div className={`w-44 h-44 rounded-full border-2 border-dashed flex items-center justify-center transition-all duration-1000 ${pulse === 1 ? 'border-green-300 bg-green-50/50' : 'border-gray-200'}`}>
              {/* Inner ring */}
              <div className={`w-24 h-24 rounded-full border-2 border-dashed flex items-center justify-center transition-all duration-1000 ${pulse === 0 ? 'border-green-400 bg-green-50/70' : 'border-gray-200'}`}>
                {/* Center user */}
                <div className="relative">
                  <UserAvatar user={DEMO_USERS[0]} size={40} showName={false} />
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-sky-600 whitespace-nowrap bg-white/80 px-1.5 py-0.5 rounded-full">You</div>
                </div>
              </div>
            </div>

            {/* Users in proximity zones */}
            {/* Close - inner zone */}
            <div className="absolute top-8 right-12">
              <UserAvatar user={DEMO_USERS[1]} size={30} />
              <div className="absolute -top-3 -right-2 bg-green-500 text-white text-[7px] px-1.5 py-0.5 rounded-full font-bold shadow-sm">
                🔊 100%
              </div>
            </div>

            {/* Medium distance */}
            <div className="absolute bottom-12 left-6">
              <UserAvatar user={DEMO_USERS[3]} size={28} />
              <div className="absolute -top-3 -right-2 bg-green-400 text-white text-[7px] px-1.5 py-0.5 rounded-full font-bold shadow-sm">
                🔉 60%
              </div>
            </div>

            {/* Far - outer zone */}
            <div className="absolute top-4 left-8 opacity-60">
              <UserAvatar user={DEMO_USERS[4]} size={24} />
              <div className="absolute -top-3 -right-2 bg-gray-400 text-white text-[7px] px-1.5 py-0.5 rounded-full font-bold shadow-sm">
                🔈 20%
              </div>
            </div>
          </div>
        </div>

        {/* Voice indicator */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white rounded-xl border border-green-200 shadow-md px-4 py-2.5">
          <div className="flex items-center gap-1">
            {[14, 18, 10, 16, 12].map((h, i) => (
              <div
                key={i}
                className="w-1 bg-green-500 rounded-full transition-all duration-300"
                style={{ height: h, animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
          <span className="text-xs font-medium text-green-700">🎙 2人の声が聞こえます</span>
        </div>
      </div>
    </BrowserFrame>
  );
}

// ---------- Focus Timer Mockup ----------
export function FocusMockup({ className = '' }: { className?: string }) {
  const [time, setTime] = useState(18 * 60 + 42);

  useEffect(() => {
    const timer = setInterval(() => setTime(t => (t > 0 ? t - 1 : 25 * 60)), 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  const progress = (time / (25 * 60)) * 100;

  return (
    <BrowserFrame className={className} url="smartoffice.app/f/my-team">
      <div className="relative bg-gradient-to-br from-amber-50/80 via-white to-orange-50/60 flex flex-col items-center justify-center gap-5 pt-12 pb-6" style={{ height: 420 }}>
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 h-10 bg-white border-b border-gray-100 flex items-center px-4">
          <div className="text-sm font-bold text-gray-800">S</div>
          <div className="text-xs text-gray-500 ml-3">集中タイマー</div>
          <div className="ml-auto flex items-center gap-1 px-2 py-0.5 bg-amber-50 rounded-full border border-amber-200">
            <span className="text-[10px] text-amber-600 font-medium">🎯 集中モード</span>
          </div>
        </div>

        {/* Timer ring */}
        <div className="relative w-40 h-40">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="44" fill="none" stroke="#F3F4F6" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="44" fill="none"
              stroke="url(#timer-gradient)" strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 44}`}
              strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="timer-gradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#EF4444" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold text-gray-900 tabular-nums">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <div className="text-[11px] text-amber-600 font-medium mt-1">取込中</div>
          </div>
        </div>

        {/* Timer presets */}
        <div className="flex gap-2">
          {[15, 25, 50].map(m => (
            <div
              key={m}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                m === 25
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
                  : 'bg-white text-gray-400 border border-gray-200'
              }`}
            >
              {m}分
            </div>
          ))}
        </div>

        {/* Team status during focus */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-3 w-72">
          <div className="text-[10px] text-gray-400 font-medium mb-2">チームのステータス</div>
          <div className="space-y-2">
            {DEMO_USERS.slice(0, 4).map((user, i) => (
              <div key={i} className="flex items-center gap-2">
                <UserAvatar user={user} size={20} showName={false} showStatus={true} />
                <span className="text-[11px] text-gray-700 flex-1">{user.name}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                  user.status === 'focusing' ? 'bg-amber-100 text-amber-700' :
                  user.status === 'busy' ? 'bg-red-100 text-red-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {user.status === 'focusing' ? '🎯 取込中' :
                   user.status === 'busy' ? '🔴 ビジー' : '🟢 オンライン'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[10px] text-amber-500 font-medium">取込中は着信を自動で保留します 🔕</p>
      </div>
    </BrowserFrame>
  );
}

// ---------- Hero Product Preview ----------
export function HeroProductPreview({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* Glow effect behind */}
      <div className="absolute -inset-4 bg-gradient-to-br from-sky-200/40 via-blue-200/30 to-indigo-200/40 rounded-3xl blur-2xl" />
      <OfficeMockup className="relative" />
    </div>
  );
}
