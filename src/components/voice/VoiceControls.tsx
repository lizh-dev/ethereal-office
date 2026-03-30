'use client';

import { useEffect, useRef } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import type { WebRTCState } from '@/hooks/useWebRTC';

interface VoiceControlsProps {
  webrtc: WebRTCState;
}

export default function VoiceControls({ webrtc }: VoiceControlsProps) {
  const { isVoiceActive, isMuted, toggleMute, leaveVoice, joinVoice, canJoinVoice, currentZoneName, remoteStreams, activeSpeakers } = webrtc;
  const users = useOfficeStore((s) => s.users);
  const autoVoiceEnabled = useOfficeStore((s) => s.autoVoiceEnabled);
  const setAutoVoiceEnabled = useOfficeStore((s) => s.setAutoVoiceEnabled);
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

  // Not in voice — show join button or auto-voice indicator
  if (!isVoiceActive) {
    return (
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
        {/* Auto Voice toggle */}
        <button
          onClick={() => setAutoVoiceEnabled(!autoVoiceEnabled)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg shadow-sm text-[10px] font-medium transition-all border ${
            autoVoiceEnabled
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-gray-50 border-gray-200 text-gray-500'
          }`}
          title={autoVoiceEnabled ? '自動通話ON: 着席で自動接続' : '自動通話OFF: 手動で接続'}
        >
          {autoVoiceEnabled ? '🎙️ 自動通話ON' : '🔇 自動通話OFF'}
        </button>
        {/* Manual join button */}
        {canJoinVoice && (
          <button
            onClick={joinVoice}
            className="flex items-center gap-2 px-3 py-2 rounded-lg shadow-md text-xs font-semibold text-white transition-all hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="currentColor" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {currentZoneName}で通話
          </button>
        )}
      </div>
    );
  }

  // In voice — show controls
  const peerCount = remoteStreams.size;
  const speakerNames: string[] = [];
  for (const userId of activeSpeakers) {
    const user = users.find((u) => u.id === userId);
    if (user) speakerNames.push(user.name);
  }

  return (
    <div className="absolute top-3 right-3 z-20 flex items-center gap-2 px-3 py-2 rounded-lg shadow-md"
      style={{ background: 'rgba(17, 24, 39, 0.9)', backdropFilter: 'blur(8px)' }}>
      {/* Status */}
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full" style={{
          backgroundColor: peerCount > 0 ? '#4ADE80' : '#FBBF24',
          boxShadow: peerCount > 0 ? '0 0 4px #4ADE80' : '0 0 4px #FBBF24',
        }} />
        <span className="text-[11px] text-gray-300 font-medium">
          {peerCount > 0
            ? currentZoneName
              ? `${currentZoneName} · ${peerCount}人と通話中`
              : `${peerCount}人と通話中`
            : currentZoneName
              ? `${currentZoneName} · 接続中...`
              : '接続中...'}
        </span>
      </div>

      {/* Speaker indicator */}
      {speakerNames.length > 0 && (
        <span className="text-[10px] text-green-400 font-medium max-w-[80px] truncate">
          🎤 {speakerNames.join(', ')}
        </span>
      )}

      {/* Mute */}
      <button onClick={toggleMute} className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
        style={{ backgroundColor: isMuted ? 'rgba(239,68,68,0.9)' : 'rgba(255,255,255,0.15)' }}
        title={isMuted ? 'ミュート解除' : 'ミュート'}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-white">
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

      {/* Leave */}
      <button onClick={leaveVoice} className="px-2 py-1 rounded text-[10px] font-medium text-red-300 hover:text-white hover:bg-red-600 transition-all"
        title="通話を終了">
        退出
      </button>
    </div>
  );
}
