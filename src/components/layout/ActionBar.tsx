'use client';

import { useState } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import { useFocusTimer } from '@/hooks/useFocusTimer';

/**
 * Unified action bar — positioned above chat input bar.
 * White glass style matching the system's clean design language.
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

  const statusColor = currentUser.status === 'online' ? '#22C55E' :
    currentUser.status === 'busy' ? '#EF4444' :
    currentUser.status === 'focusing' ? '#F59E0B' : '#9CA3AF';

  return (
    <div className="fixed bottom-[116px] md:bottom-[52px] left-1/2 -translate-x-1/2 z-[70]">
      <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-2xl shadow-lg border border-gray-200/80"
        style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(12px)' }}>

        {/* Status pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: statusColor }} />
          <span className="text-[11px] text-gray-600 font-medium max-w-[80px] truncate">
            {seatLabel ? `${seatLabel}` : (
              currentUser.status === 'online' ? 'オンライン' :
              currentUser.status === 'busy' ? 'ビジー' :
              currentUser.status === 'focusing' ? '集中中' : '離席'
            )}
          </span>
        </div>

        <div className="w-px h-5 bg-gray-200" />

        {/* Auto voice toggle */}
        <button
          onClick={() => setAutoVoiceEnabled(!autoVoiceEnabled)}
          className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all ${
            autoVoiceEnabled
              ? 'bg-indigo-50 text-indigo-500 hover:bg-indigo-100'
              : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
          }`}
          title={autoVoiceEnabled ? '自動通話ON' : '自動通話OFF'}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
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
              className={`flex items-center gap-1 px-2 h-8 rounded-xl transition-all text-[11px] font-semibold tabular-nums ${
                focusTimer.isBreak
                  ? 'bg-green-50 text-green-600'
                  : 'bg-amber-50 text-amber-600'
              }`}
            >
              {focusTimer.isBreak ? '☕' : '🎯'}
              {Math.floor(focusTimer.remainingSeconds / 60)}:{(focusTimer.remainingSeconds % 60).toString().padStart(2, '0')}
            </button>
          ) : (
            <button
              onClick={() => setShowFocusPresets(v => !v)}
              className="flex items-center justify-center w-8 h-8 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
              title="集中モード"
            >
              <span className="text-[13px]">🎯</span>
            </button>
          )}
          {showFocusPresets && !focusTimer.isActive && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex items-center gap-1 px-2 py-1.5 rounded-xl shadow-lg border border-gray-200"
              style={{ background: 'rgba(255, 255, 255, 0.97)', backdropFilter: 'blur(12px)' }}>
              {[15, 25, 50].map(min => (
                <button key={min}
                  onClick={() => { focusTimer.startFocus(min); setShowFocusPresets(false); }}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                >
                  {min}分
                </button>
              ))}
              <button onClick={() => setShowFocusPresets(false)}
                className="px-1 py-1 text-gray-400 hover:text-gray-600 text-xs">✕</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
