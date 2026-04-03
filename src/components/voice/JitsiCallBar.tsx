'use client';

import type { JitsiVoiceState } from '@/hooks/useJitsiVoice';

interface JitsiCallBarProps {
  jitsi: JitsiVoiceState;
}

export default function JitsiCallBar({ jitsi }: JitsiCallBarProps) {
  if (!jitsi.activeRoom) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 110, left: '50%', transform: 'translateX(-50%)',
      zIndex: 71, display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 14px', borderRadius: 20,
      background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
      border: '1px solid #e2e8f0', fontSize: 12,
    }}>
      {/* Active indicator */}
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />

      {/* Room info */}
      <span style={{ color: '#334155', fontWeight: 600 }}>
        {jitsi.zoneName || '通話中'}
      </span>
      <span style={{ color: '#94a3b8' }}>— {jitsi.participantCount}人</span>

      {/* Mute toggle */}
      <button
        onClick={jitsi.toggleMute}
        style={{
          width: 28, height: 28, borderRadius: '50%', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: 13,
          background: jitsi.isMuted ? '#fee2e2' : '#f0fdf4',
          color: jitsi.isMuted ? '#ef4444' : '#22c55e',
        }}
        title={jitsi.isMuted ? 'ミュート解除' : 'ミュート'}
      >
        {jitsi.isMuted ? '🔇' : '🎤'}
      </button>

      {/* Leave */}
      <button
        onClick={jitsi.leaveRoom}
        style={{
          padding: '4px 10px', borderRadius: 12, border: 'none',
          background: '#ef4444', color: 'white', fontSize: 11,
          fontWeight: 600, cursor: 'pointer',
        }}
      >
        退出
      </button>
    </div>
  );
}
