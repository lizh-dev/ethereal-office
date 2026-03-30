'use client';

import { useFocusTimer } from '@/hooks/useFocusTimer';

const PRESETS = [
  { label: '25分', minutes: 25 },
  { label: '50分', minutes: 50 },
  { label: '15分', minutes: 15 },
];

export default function FocusTimerPanel() {
  const { isActive, isBreak, remainingSeconds, startFocus, stopFocus } = useFocusTimer();

  const min = Math.floor(remainingSeconds / 60);
  const sec = remainingSeconds % 60;
  const timeStr = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;

  if (isActive) {
    return (
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-xl shadow-lg border"
        style={{
          background: isBreak ? 'rgba(34, 197, 94, 0.95)' : 'rgba(245, 158, 11, 0.95)',
          borderColor: isBreak ? 'rgba(34, 197, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <span className="text-white text-sm font-bold">{isBreak ? '☕ 休憩' : '🎯 集中'}</span>
        <span className="text-white text-lg font-mono font-bold tabular-nums">{timeStr}</span>
        <button
          onClick={stopFocus}
          className="px-2 py-1 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded-lg transition-colors"
        >
          停止
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-2 bg-white/95 rounded-xl shadow-md border border-gray-200 backdrop-blur-sm">
      <span className="text-xs text-gray-600 font-medium">🎯 集中モード</span>
      {PRESETS.map((p) => (
        <button
          key={p.minutes}
          onClick={() => startFocus(p.minutes)}
          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-medium rounded-lg border border-amber-200 transition-colors"
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
