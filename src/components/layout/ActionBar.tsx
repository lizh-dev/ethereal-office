'use client';

import { useState } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import { useWsSend } from '@/contexts/WebSocketContext';
import { useFocusTimer } from '@/hooks/useFocusTimer';
import dynamic from 'next/dynamic';
import JitsiMeetPanel from '@/components/voice/JitsiMeetPanel';

const MeetingBoard = dynamic(() => import('@/components/voice/MeetingBoard'), { ssr: false });

const STAMPS = ['👋', '👍', '👏', '😂', '❤️', '🎉', '🤔', '☕'];

/**
 * Bottom floating bar — meeting, whiteboard, stamps.
 */
export default function ActionBar() {
  const currentUser = useOfficeStore((s) => s.currentUser);
  const editorMode = useOfficeStore((s) => s.editorMode);
  const viewMode = useOfficeStore((s) => s.viewMode);
  const canVoiceCall = useOfficeStore((s) => s.planPermissions.voiceCall);
  const canMeetingBoard = useOfficeStore((s) => s.planPermissions.meetingBoard);
  const wsSend = useWsSend();
  const focusTimer = useFocusTimer();

  const [showStamps, setShowStamps] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [meetingName, setMeetingName] = useState('');
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [showMeeting, setShowMeeting] = useState(false);
  const [showBoard, setShowBoard] = useState(false);

  const floorSlug = typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : '';

  if (editorMode === 'edit' || viewMode !== 'floor') return null;

  const handleReaction = (emoji: string) => {
    wsSend.reaction(emoji);
    useOfficeStore.setState(s => ({ reactions: { ...s.reactions, [currentUser.id]: emoji } }));
    setTimeout(() => useOfficeStore.setState(s => { const { [currentUser.id]: _, ...rest } = s.reactions; return { reactions: rest }; }), 3000);
    setShowStamps(false);
  };

  const handleStartMeeting = () => {
    const name = meetingName.trim() || 'ミーティング';
    const id = `${floorSlug}-${name.replace(/\s+/g, '-')}-${Date.now()}`;
    setActiveMeetingId(id);
    setShowMeeting(true);
    setShowCreateDialog(false);
    setMeetingName('');
    useOfficeStore.getState().addActivity('meeting', `${currentUser.name} がミーティング「${name}」を開始`);
    window.open(`http://localhost:8880/${id}#userInfo.displayName="${encodeURIComponent(currentUser.name)}"`, '_blank');
  };

  const handleLeaveMeeting = () => {
    setActiveMeetingId(null);
    setShowMeeting(false);
  };

  return (
    <>
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

        {/* Meeting create popover — floats above */}
        {showCreateDialog && !activeMeetingId && (
          <div className="flex items-center gap-2 justify-center mb-2 px-3 py-2 bg-white rounded-2xl shadow-lg border border-gray-100">
            <input
              type="text"
              value={meetingName}
              onChange={e => setMeetingName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStartMeeting()}
              placeholder="ミーティング名（任意）"
              autoFocus
              className="w-[160px] px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-sky-300"
            />
            <button onClick={handleStartMeeting}
              className="px-3 py-1.5 rounded-lg bg-sky-500 text-white text-xs font-semibold hover:bg-sky-400 transition-colors"
            >開始</button>
            <button onClick={() => setShowCreateDialog(false)}
              className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
          </div>
        )}

        {/* Main bar */}
        <div className="flex items-center gap-1 px-1.5 py-1 bg-white rounded-2xl shadow-lg border border-gray-200/80"
          style={{ backdropFilter: 'blur(12px)' }}>

          {/* Meeting button */}
          {canVoiceCall && (
            <button
              onClick={() => {
                if (activeMeetingId) {
                  setShowMeeting(v => !v);
                } else {
                  setShowCreateDialog(v => !v);
                }
              }}
              className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                activeMeetingId ? 'text-green-500 bg-green-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
              title={activeMeetingId ? 'ミーティング表示/非表示' : 'ミーティングを開始'}
            >
              <span className="text-[13px]">🎥</span>
            </button>
          )}

          {/* Whiteboard button */}
          {canMeetingBoard && (
            <button
              onClick={() => setShowBoard(v => !v)}
              className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                showBoard ? 'text-indigo-500 bg-indigo-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
              title="ホワイトボード"
            >
              <span className="text-[13px]">📝</span>
            </button>
          )}

          {/* Stamp button */}
          <button onClick={() => setShowStamps(v => !v)}
            className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
              showStamps ? 'text-indigo-500 bg-indigo-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
            title="スタンプ">
            <span className="text-[13px]">😀</span>
          </button>

          {/* Focus timer display (when active) */}
          {focusTimer.isActive && (
            <button onClick={() => focusTimer.stopFocus()}
              className={`h-8 px-2 rounded-xl flex items-center gap-1 flex-shrink-0 text-[11px] font-semibold tabular-nums transition-all ${
                focusTimer.isBreak ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
              }`}>
              {focusTimer.isBreak ? '☕' : '🎯'}
              {Math.floor(focusTimer.remainingSeconds / 60)}:{(focusTimer.remainingSeconds % 60).toString().padStart(2, '0')}
            </button>
          )}
        </div>
      </div>

      {/* Jitsi Meeting Panel */}
      {activeMeetingId && showMeeting && (
        <JitsiMeetPanel
          roomName={activeMeetingId}
          userName={currentUser.name}
          onClose={handleLeaveMeeting}
        />
      )}

      {/* Standalone Whiteboard */}
      {showBoard && (
        <MeetingBoard
          meetingId={`${floorSlug}-board`}
          onClose={() => setShowBoard(false)}
        />
      )}
    </>
  );
}
