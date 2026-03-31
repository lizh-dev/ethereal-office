'use client';

import { useEffect, useRef } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import { useWsSend } from '@/contexts/WebSocketContext';
import type { WebRTCState } from '@/hooks/useWebRTC';

interface VoiceControlsProps {
  webrtc: WebRTCState;
}

/**
 * Voice controls — renders as a floating bar when in a call.
 * Positioned bottom-center, visually consistent with ActionBar.
 * When NOT in a call, renders nothing (ActionBar handles idle state).
 */
export default function VoiceControls({ webrtc }: VoiceControlsProps) {
  const { isVoiceActive, isMuted, toggleMute, leaveVoice, joinVoice, canJoinVoice, currentZoneName, remoteStreams, activeSpeakers, startScreenShare } = webrtc;
  const users = useOfficeStore((s) => s.users);
  const screenShareUserId = useOfficeStore((s) => s.screenShareUserId);
  const currentUser = useOfficeStore((s) => s.currentUser);
  const wsSend = useWsSend();
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Attach remote audio streams
  useEffect(() => {
    for (const [userId, stream] of remoteStreams) {
      let audio = audioRefs.current.get(userId);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        audioRefs.current.set(userId, audio);
      }
      if (audio.srcObject !== stream) audio.srcObject = stream;
    }
    for (const [userId, audio] of audioRefs.current) {
      if (!remoteStreams.has(userId)) {
        audio.srcObject = null;
        audioRefs.current.delete(userId);
      }
    }
  }, [remoteStreams]);

  useEffect(() => {
    return () => {
      for (const audio of audioRefs.current.values()) audio.srcObject = null;
      audioRefs.current.clear();
    };
  }, []);

  const handleStartScreenShare = async () => {
    const stream = await startScreenShare();
    if (stream) {
      wsSend.screenShareStart();
    }
  };

  // Not in voice — show manual join pill if available (inside ActionBar area)
  if (!isVoiceActive) {
    if (!canJoinVoice) return null;
    return (
      <div className="fixed bottom-[106px] md:bottom-[52px] left-1/2 -translate-x-1/2 z-[80]">
        <button
          onClick={joinVoice}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full shadow-lg text-xs font-semibold text-white transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" fill="currentColor" />
            <path d="M19 10v2a7 7 0 01-14 0v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {currentZoneName}で通話に参加
        </button>
      </div>
    );
  }

  // In voice — compact call bar above ActionBar
  const peerCount = remoteStreams.size;
  const speakerNames: string[] = [];
  for (const userId of activeSpeakers) {
    const user = users.find((u) => u.id === userId);
    if (user) speakerNames.push(user.name);
  }
  const isScreenSharing = screenShareUserId === currentUser.id;

  return (
    <div className="fixed bottom-[106px] md:bottom-[52px] left-1/2 -translate-x-1/2 z-[80]">
      <div className="flex items-center gap-1 px-2 py-1.5 rounded-2xl shadow-lg border border-green-200"
        style={{ background: 'rgba(240, 253, 244, 0.95)', backdropFilter: 'blur(12px)' }}>

        {/* Call status */}
        <div className="flex items-center gap-1.5 px-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[11px] text-green-700 font-medium">
            {peerCount > 0
              ? `${currentZoneName || '通話中'} · ${peerCount}人`
              : '接続中...'}
          </span>
        </div>

        {speakerNames.length > 0 && (
          <span className="text-[10px] text-green-600 max-w-[60px] truncate">
            🎤{speakerNames[0]}
          </span>
        )}

        <div className="w-px h-5 bg-green-200" />

        {/* Mute toggle */}
        <button onClick={toggleMute}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
            isMuted ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
          title={isMuted ? 'ミュート解除' : 'ミュート'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            {isMuted ? (
              <path d="M1 1l22 22M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6M17 16.95A7 7 0 015 12v-2m14 0v2c0 .76-.12 1.5-.35 2.18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <>
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" fill="currentColor" />
                <path d="M19 10v2a7 7 0 01-14 0v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </>
            )}
          </svg>
        </button>

        {/* Screen share */}
        {!isScreenSharing && (
          <button onClick={handleStartScreenShare}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-green-100 text-green-700 hover:bg-green-200 transition-all"
            title="画面共有">
            <span className="text-[12px]">🖥️</span>
          </button>
        )}

        {/* Leave call */}
        <button onClick={leaveVoice}
          className="w-8 h-8 rounded-xl flex items-center justify-center bg-red-100 hover:bg-red-200 text-red-600 transition-all"
          title="通話を終了">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" fill="currentColor"/>
            <path d="M4 4l16 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
