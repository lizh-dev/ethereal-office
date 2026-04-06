'use client';

import { useState } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import { useWsSend } from '@/contexts/WebSocketContext';
import { useFocusTimer } from '@/hooks/useFocusTimer';
import { Video, PenTool, Smile, Coffee, Target, PhoneCall } from 'lucide-react';

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
  const canPerParticipantBoard = useOfficeStore((s) => s.planPermissions.perParticipantBoard);
  const wsSend = useWsSend();
  const focusTimer = useFocusTimer();

  const myMeetingId = useOfficeStore((s) => s.myMeetingId);
  const [showStamps, setShowStamps] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [meetingName, setMeetingName] = useState('');
  const [meetingPassword, setMeetingPassword] = useState('');
  const [individualBoard, setIndividualBoard] = useState(false);

  const floorSlug = typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : '';

  // BroadcastChannel listener is now in the floor page (always-mounted)

  if (editorMode === 'edit' || viewMode !== 'floor') return null;

  const handleReaction = (emoji: string) => {
    wsSend.reaction(emoji);
    useOfficeStore.setState(s => ({ reactions: { ...s.reactions, [currentUser.id]: emoji } }));
    setTimeout(() => useOfficeStore.setState(s => { const { [currentUser.id]: _, ...rest } = s.reactions; return { reactions: rest }; }), 3000);
    setShowStamps(false);
  };

  const handleStartMeeting = () => {
    // Check concurrent meeting limit on client side before sending WS
    const { activeMeetings, planPermissions } = useOfficeStore.getState();
    if (planPermissions.maxConcurrentMeetings > 0 && activeMeetings.length >= planPermissions.maxConcurrentMeetings) {
      useOfficeStore.getState().addNotification(`Freeプランでは同時に${planPermissions.maxConcurrentMeetings}つのミーティングまでです`);
      setShowCreateDialog(false);
      return;
    }

    const name = meetingName.trim() || 'ミーティング';
    const pw = meetingPassword.trim();
    const token = Math.random().toString(36).substring(2, 10);
    const id = `${floorSlug}-${name.replace(/\s+/g, '-')}-${Date.now()}-${token}`;
    const ib = individualBoard;
    setShowCreateDialog(false);
    setMeetingName('');
    setMeetingPassword('');
    setIndividualBoard(false);
    useOfficeStore.getState().setMyMeetingId(id);
    useOfficeStore.getState().addActivity('meeting', `${currentUser.name} がミーティング「${name}」を開始`);
    wsSend.meetingStart(id, name, !!pw, pw, ib);
    if (pw) {
      try { localStorage.setItem(`meeting-pw-${id}`, pw); } catch { /* ignore */ }
    }
    const meetingUrl = `/meeting/${id}?name=${encodeURIComponent(currentUser.name)}&uid=${encodeURIComponent(currentUser.id)}${ib ? '&ib=1' : ''}`;
    window.open(meetingUrl, '_blank');
    if (ib) {
      const templateUrl = `/board/${id}-template?name=${encodeURIComponent(currentUser.name)}&floor=${encodeURIComponent(floorSlug)}`;
      window.open(templateUrl, '_blank');
    }
  };

  const handleLeaveMeeting = () => {
    if (myMeetingId) {
      wsSend.meetingLeave(myMeetingId);
    }
    useOfficeStore.getState().setMyMeetingId(null);
  };

  return (
    <>
      <div className="fixed bottom-[62px] md:bottom-3 left-1/2 -translate-x-1/2 z-[70]" onClick={e => e.stopPropagation()}>
        {/* Stamp palette — floats above */}
        {showStamps && (
          <div className="flex gap-0.5 justify-center mb-2 px-2 py-1.5 bg-white/90 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-700/50">
            {STAMPS.map(emoji => (
              <button key={emoji} onClick={() => handleReaction(emoji)}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:scale-110 transition-all"
              >{emoji}</button>
            ))}
          </div>
        )}

        {/* Meeting create popover — floats above */}
        {showCreateDialog && (
          <div className="flex flex-col gap-2 items-center mb-2 px-3 py-2.5 bg-white/90 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-700/50">
            <div className="flex items-center gap-2 w-full">
              <input
                type="text"
                value={meetingName}
                onChange={e => setMeetingName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleStartMeeting()}
                placeholder="ミーティング名（任意）"
                autoFocus
                className="w-[160px] px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs outline-none focus:border-amber-500/50 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <button onClick={handleStartMeeting}
                className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:opacity-90 transition-colors"
              >開始</button>
              <button onClick={() => { setShowCreateDialog(false); setMeetingPassword(''); }}
                className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 text-xs">✕</button>
            </div>
            <div className="flex items-center gap-2 w-full">
              <input
                type="password"
                value={meetingPassword}
                onChange={e => setMeetingPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleStartMeeting()}
                placeholder="パスワード（任意）"
                className="w-[160px] px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs outline-none focus:border-amber-500/50 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500">空欄なら公開</span>
            </div>
            {canPerParticipantBoard && (
              <label className="flex items-start gap-2 w-full cursor-pointer">
                <input
                  type="checkbox"
                  checked={individualBoard}
                  onChange={e => setIndividualBoard(e.target.checked)}
                  className="mt-0.5 rounded"
                />
                <div className="flex flex-col">
                  <span className="text-xs text-zinc-700 dark:text-zinc-300">個別ボードモード</span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500">参加者ごとに個別のボードを配布</span>
                </div>
              </label>
            )}
          </div>
        )}

        {/* Main bar */}
        <div className="flex items-center gap-1 px-1.5 py-1 bg-white/90 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-700/50">

          {/* New meeting button — always available */}
          {canVoiceCall && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowCreateDialog(v => !v); }}
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              title="ミーティングを開始"
            >
              <Video className="w-4 h-4" strokeWidth={1.8} />
            </button>
          )}
          {/* Active meeting indicator */}
          {myMeetingId && (
            <button
              onClick={() => useOfficeStore.getState().setViewMode('meetings')}
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all text-green-500 bg-green-50"
              title="参加中のミーティング"
            >
              <PhoneCall className="w-4 h-4" strokeWidth={1.8} />
            </button>
          )}

          {/* Whiteboard button — opens in new tab */}
          {canMeetingBoard && (
            <button
              onClick={() => {
                const boardUrl = `/board/${floorSlug}-board?name=${encodeURIComponent(currentUser.name)}&floor=${encodeURIComponent(floorSlug)}&avatar=${encodeURIComponent(currentUser.avatarSeed || '')}&style=${encodeURIComponent(currentUser.avatarStyle || 'notionists')}`;
                window.open(boardUrl, '_blank');
              }}
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              title="ホワイトボード（別タブ）"
            >
              <PenTool className="w-4 h-4" strokeWidth={1.8} />
            </button>
          )}

          {/* Stamp button */}
          <button onClick={() => setShowStamps(v => !v)}
            className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
              showStamps ? 'text-accent bg-amber-50 dark:bg-amber-900/30' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
            title="スタンプ">
            <Smile className="w-4 h-4" strokeWidth={1.8} />
          </button>

          {/* Focus timer display (when active) */}
          {focusTimer.isActive && (
            <button onClick={() => focusTimer.stopFocus()}
              className={`h-8 px-2 rounded-xl flex items-center gap-1 flex-shrink-0 text-[11px] font-semibold tabular-nums transition-all ${
                focusTimer.isBreak ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
              }`}>
              {focusTimer.isBreak ? <Coffee className="w-3.5 h-3.5" strokeWidth={1.8} /> : <Target className="w-3.5 h-3.5" strokeWidth={1.8} />}
              {Math.floor(focusTimer.remainingSeconds / 60)}:{(focusTimer.remainingSeconds % 60).toString().padStart(2, '0')}
            </button>
          )}
        </div>
      </div>

      {/* Meeting status is now shown in the sidebar meeting view — no floating panel */}
    </>
  );
}
