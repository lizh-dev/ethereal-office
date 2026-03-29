'use client';

import { useEffect, useRef } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import type { WebRTCState } from '@/hooks/useWebRTC';

interface VoiceControlsProps {
  webrtc: WebRTCState;
}

export default function VoiceControls({ webrtc }: VoiceControlsProps) {
  const { isVoiceActive, isMuted, toggleMute, leaveVoice, joinVoice, canJoinVoice, remoteStreams, activeSpeakers } = webrtc;
  const users = useOfficeStore((s) => s.users);
  const currentUser = useOfficeStore((s) => s.currentUser);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Attach remote audio streams to audio elements
  useEffect(() => {
    for (const [userId, stream] of remoteStreams) {
      let audio = audioRefs.current.get(userId);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        audioRefs.current.set(userId, audio);
      }
      if (audio.srcObject !== stream) {
        audio.srcObject = stream;
      }
    }
    // Clean up audio elements for disconnected peers
    for (const [userId, audio] of audioRefs.current) {
      if (!remoteStreams.has(userId)) {
        audio.srcObject = null;
        audioRefs.current.delete(userId);
      }
    }
  }, [remoteStreams]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      for (const audio of audioRefs.current.values()) {
        audio.srcObject = null;
      }
      audioRefs.current.clear();
    };
  }, []);

  if (!isVoiceActive) {
    // Show "join voice" button if there are peers in the same zone
    if (!canJoinVoice) return null;
    return (
      <div className="fixed bottom-24 md:bottom-16 right-4 z-50">
        <button
          onClick={joinVoice}
          className="flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 4px 15px rgba(34,197,94,0.4)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="currentColor" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          通話に参加
        </button>
      </div>
    );
  }

  const peerCount = remoteStreams.size;

  // Get names of active speakers
  const speakerNames: string[] = [];
  for (const userId of activeSpeakers) {
    const user = users.find((u) => u.id === userId);
    if (user) {
      speakerNames.push(user.name);
    }
  }

  return (
    <div
      className="fixed bottom-24 md:bottom-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-2xl shadow-lg border"
      style={{
        background: 'rgba(17, 24, 39, 0.92)',
        borderColor: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Voice status */}
      <div className="flex items-center gap-2 mr-1">
        <div
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: peerCount > 0 ? '#4ADE80' : '#FBBF24',
            boxShadow: peerCount > 0 ? '0 0 6px #4ADE80' : '0 0 6px #FBBF24',
          }}
        />
        <span className="text-xs text-gray-300 font-medium whitespace-nowrap">
          {peerCount > 0
            ? `${peerCount}人と通話中`
            : '接続中...'}
        </span>
      </div>

      {/* Active speakers */}
      {speakerNames.length > 0 && (
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-green-400">
            <path
              d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
              fill="currentColor"
            />
            <path
              d="M19 10v2a7 7 0 0 1-14 0v-2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="text-xs text-green-400 font-medium max-w-[120px] truncate">
            {speakerNames.join(', ')}
          </span>
        </div>
      )}

      {/* Mute/unmute button */}
      <button
        onClick={toggleMute}
        className="flex items-center justify-center w-9 h-9 rounded-full transition-all"
        style={{
          backgroundColor: isMuted ? 'rgba(239, 68, 68, 0.9)' : 'rgba(255, 255, 255, 0.15)',
        }}
        title={isMuted ? 'ミュート解除' : 'ミュート'}
      >
        {isMuted ? (
          // Muted mic icon (with slash)
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
            <path
              d="M1 1l22 22M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.12 1.5-.35 2.18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          // Active mic icon
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
            <path
              d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
              fill="currentColor"
            />
            <path
              d="M19 10v2a7 7 0 0 1-14 0v-2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {/* Leave voice button */}
      <button
        onClick={leaveVoice}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:bg-red-600"
        style={{ backgroundColor: 'rgba(239, 68, 68, 0.7)', color: '#fff' }}
        title="通話を終了"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-white">
          <path
            d="M22.74 16.35l-3.12-3.12a2 2 0 0 0-2.83 0l-1.14 1.14a16.1 16.1 0 0 1-6.02-6.02l1.14-1.14a2 2 0 0 0 0-2.83L8.65 2.26a2 2 0 0 0-2.83 0L3.5 4.58c-1.52 1.52-.75 5.1 2.22 8.07s6.55 3.74 8.07 2.22l2.32-2.32a2 2 0 0 0 0-2.83"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span>退出</span>
      </button>
    </div>
  );
}
