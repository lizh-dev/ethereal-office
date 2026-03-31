'use client';

import { useState } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import { useFocusTimer } from '@/hooks/useFocusTimer';

/**
 * Unified action bar — Google Meet / Discord style.
 * Positioned at bottom-center of the canvas, contains all user actions.
 */
export default function ActionBar() {
  const currentUser = useOfficeStore((s) => s.currentUser);
  const currentSeatId = useOfficeStore((s) => s.currentSeatId);
  const autoVoiceEnabled = useOfficeStore((s) => s.autoVoiceEnabled);
  const setAutoVoiceEnabled = useOfficeStore((s) => s.setAutoVoiceEnabled);
  const editorMode = useOfficeStore((s) => s.editorMode);
  const [showFocusPresets, setShowFocusPresets] = useState(false);

  const focusTimer = useFocusTimer();

  if (editorMode === 'edit') return null;

  const seatLabel = (() => {
    if (!currentSeatId) return null;
    const zones = useOfficeStore.getState().zones;
    for (const z of zones) {
      const seat = z.seats.find(s => s.id === currentSeatId);
      if (seat) return seat.label || seat.id;
    }
    return null;
  })();

  return (
    <div className="fixed bottom-[62px] md:bottom-3 left-1/2 -translate-x-1/2 z-[80]">
      <div className="flex items-center gap-1 px-2 py-1.5 rounded-2xl shadow-xl border border-white/10"
        style={{ background: 'rgba(30, 30, 40, 0.88)', backdropFilter: 'blur(16px)' }}>

        {/* Status pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/8">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{
            background: currentUser.status === 'online' ? '#4ADE80' :
              currentUser.status === 'busy' ? '#F87171' :
              currentUser.status === 'focusing' ? '#FBBF24' : '#9CA3AF',
            boxShadow: `0 0 6px ${currentUser.status === 'online' ? '#4ADE8060' : 'transparent'}`,
          }} />
          <span className="text-[11px] text-gray-300 font-medium max-w-[80px] truncate">
            {seatLabel ? `📍 ${seatLabel}` : (
              currentUser.status === 'online' ? 'オンライン' :
              currentUser.status === 'busy' ? 'ビジー' :
              currentUser.status === 'focusing' ? '集中中' : '離席'
            )}
          </span>
        </div>

        <div className="w-px h-5 bg-white/10" />

        {/* Auto voice toggle */}
        <button
          onClick={() => setAutoVoiceEnabled(!autoVoiceEnabled)}
          className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all ${
            autoVoiceEnabled
              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
              : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300'
          }`}
          title={autoVoiceEnabled ? '自動通話ON' : '自動通話OFF'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            {autoVoiceEnabled ? (
              <>
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" fill="currentColor" />
                <path d="M19 10v2a7 7 0 01-14 0v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </>
            ) : (
              <path d="M1 1l22 22M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6M17 16.95A7 7 0 015 12v-2m14 0v2c0 .76-.12 1.5-.35 2.18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>

        {/* Focus timer */}
        <div className="relative">
          {focusTimer.isActive ? (
            <button
              onClick={() => focusTimer.stopFocus()}
              className={`flex items-center gap-1.5 px-2.5 h-9 rounded-xl transition-all ${
                focusTimer.isBreak
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}
              title="集中モード停止"
            >
              <span className="text-xs">{focusTimer.isBreak ? '☕' : '🎯'}</span>
              <span className="text-[11px] font-mono font-semibold tabular-nums">
                {Math.floor(focusTimer.remainingSeconds / 60)}:{(focusTimer.remainingSeconds % 60).toString().padStart(2, '0')}
              </span>
            </button>
          ) : (
            <button
              onClick={() => setShowFocusPresets(v => !v)}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300 transition-all"
              title="集中モード"
            >
              <span className="text-sm">🎯</span>
            </button>
          )}
          {/* Focus presets popup */}
          {showFocusPresets && !focusTimer.isActive && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex items-center gap-1 px-2 py-1.5 rounded-xl shadow-xl border border-white/10"
              style={{ background: 'rgba(30, 30, 40, 0.95)', backdropFilter: 'blur(16px)' }}>
              {[15, 25, 50].map(min => (
                <button key={min}
                  onClick={() => { focusTimer.startFocus(min); setShowFocusPresets(false); }}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-all"
                >
                  {min}分
                </button>
              ))}
              <button onClick={() => setShowFocusPresets(false)}
                className="px-1.5 py-1.5 text-gray-500 hover:text-gray-300 text-xs">
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Stamp button — dispatches click to canvas stamp button */}
        <button
          onClick={() => {
            const btn = document.querySelector('button[title="スタンプ"]') as HTMLButtonElement;
            if (btn) btn.click();
          }}
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300 transition-all"
          title="リアクション"
        >
          <span className="text-sm">😀</span>
        </button>
      </div>
    </div>
  );
}
