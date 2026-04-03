'use client';

import { useState } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import { useWsSend } from '@/contexts/WebSocketContext';
import { useFocusTimer } from '@/hooks/useFocusTimer';
import ProBadge from '@/components/plan/ProBadge';

const STAMPS = ['👋', '👍', '👏', '😂', '❤️', '🎉', '🤔', '☕'];

/**
 * Unified bottom bar — single bar combining status, actions, and chat input.
 * Slack/Notion inspired: icons left, input center, send right.
 */
export default function ActionBar() {
  const currentUser = useOfficeStore((s) => s.currentUser);
  const currentSeatId = useOfficeStore((s) => s.currentSeatId);
  const autoVoiceEnabled = useOfficeStore((s) => s.autoVoiceEnabled);
  const setAutoVoiceEnabled = useOfficeStore((s) => s.setAutoVoiceEnabled);
  const editorMode = useOfficeStore((s) => s.editorMode);
  const viewMode = useOfficeStore((s) => s.viewMode);
  const canVoiceCall = useOfficeStore((s) => s.planPermissions.voiceCall);
  const activeJitsiRoom = useOfficeStore((s) => s.activeJitsiRoom);
  const wsSend = useWsSend();

  const [chatInput, setChatInput] = useState('');
  const [showStamps, setShowStamps] = useState(false);
  const [showFocusPresets, setShowFocusPresets] = useState(false);
  const focusTimer = useFocusTimer();

  if (editorMode === 'edit' || viewMode !== 'floor') return null;

  const handleSend = () => {
    if (!chatInput.trim()) return;
    wsSend.chat(chatInput.trim());
    setChatInput('');
  };

  const handleReaction = (emoji: string) => {
    wsSend.reaction(emoji);
    useOfficeStore.setState(s => ({ reactions: { ...s.reactions, [currentUser.id]: emoji } }));
    setTimeout(() => useOfficeStore.setState(s => { const { [currentUser.id]: _, ...rest } = s.reactions; return { reactions: rest }; }), 3000);
    setShowStamps(false);
  };

  const statusColor = currentUser.status === 'online' ? '#22C55E' :
    currentUser.status === 'busy' ? '#EF4444' :
    currentUser.status === 'focusing' ? '#F59E0B' : '#9CA3AF';

  return (
    <div className="fixed bottom-[62px] md:bottom-3 left-1/2 -translate-x-1/2 z-[70]" onClick={e => e.stopPropagation()}>
      {/* Stamp palette — floats above */}
      {showStamps && (
        <div className="flex gap-0.5 justify-center mb-2 px-2 py-1.5 bg-white rounded-2xl shadow-lg border border-gray-100">
          {STAMPS.map(emoji => (
            <button key={emoji} onClick={() => handleReaction(emoji)}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-lg hover:bg-gray-100 hover:scale-110 transition-all"
            >{emoji}</button>
          ))}
        </div>
      )}

      {/* Focus presets popup — floats above */}
      {showFocusPresets && !focusTimer.isActive && (
        <div className="flex items-center gap-1 justify-center mb-2 px-3 py-2 bg-white rounded-2xl shadow-lg border border-gray-100">
          <span className="text-xs text-gray-500 mr-1">集中:</span>
          {[15, 25, 50].map(min => (
            <button key={min}
              onClick={() => { focusTimer.startFocus(min); setShowFocusPresets(false); }}
              className="px-3 py-1 rounded-lg text-xs font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
            >{min}分</button>
          ))}
          <button onClick={() => setShowFocusPresets(false)} className="ml-1 text-gray-400 hover:text-gray-600 text-xs">✕</button>
        </div>
      )}

      {/* Main bar */}
      <div className="flex items-center gap-1 px-1.5 py-1 bg-white rounded-2xl shadow-lg border border-gray-200/80"
        style={{ backdropFilter: 'blur(12px)' }}>

        {/* Status dot */}
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" title={currentUser.status}>
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: statusColor, boxShadow: `0 0 6px ${statusColor}40` }} />
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200 flex-shrink-0" />

        {/* Action icons */}
        {canVoiceCall ? (
          <button
            onClick={() => setAutoVoiceEnabled(!autoVoiceEnabled)}
            className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all relative ${
              activeJitsiRoom ? 'text-green-500 bg-green-50' : autoVoiceEnabled ? 'text-indigo-500 bg-indigo-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
            title={activeJitsiRoom ? '通話中' : autoVoiceEnabled ? '自動通話ON' : '自動通話OFF'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
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
        ) : (
          <button
            onClick={() => {
              const slug = window.location.pathname.split('/')[2];
              window.open(`/f/${slug}/upgrade`, '_blank');
            }}
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all text-gray-300 hover:text-gray-400 relative"
            title="音声通話（Proプラン）"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M1 1l22 22M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6M17 16.95A7 7 0 015 12v-2m14 0v2c0 .76-.12 1.5-.35 2.18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <ProBadge />
          </button>
        )}

        {focusTimer.isActive ? (
          <button onClick={() => focusTimer.stopFocus()}
            className={`h-8 px-2 rounded-xl flex items-center gap-1 flex-shrink-0 text-[11px] font-semibold tabular-nums transition-all ${
              focusTimer.isBreak ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
            }`}>
            {focusTimer.isBreak ? '☕' : '🎯'}
            {Math.floor(focusTimer.remainingSeconds / 60)}:{(focusTimer.remainingSeconds % 60).toString().padStart(2, '0')}
          </button>
        ) : (
          <button onClick={() => setShowFocusPresets(v => !v)}
            className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
              showFocusPresets ? 'text-amber-500 bg-amber-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
            title="集中モード">
            <span className="text-[13px]">🎯</span>
          </button>
        )}

        <button onClick={() => setShowStamps(v => !v)}
          className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
            showStamps ? 'text-indigo-500 bg-indigo-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          }`}
          title="スタンプ">
          <span className="text-[13px]">😀</span>
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200 flex-shrink-0" />

        {/* Chat input */}
        <input
          type="text"
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
          placeholder="メッセージ..."
          className="w-[120px] sm:w-[200px] md:w-[280px] h-8 px-3 bg-transparent text-[13px] text-gray-700 placeholder:text-gray-400 outline-none"
        />

        {/* Send */}
        <button onClick={handleSend}
          className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
            chatInput.trim() ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-400'
          }`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
