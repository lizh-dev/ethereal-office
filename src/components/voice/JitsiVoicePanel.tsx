'use client';

import type { JitsiVoiceState } from '@/hooks/useJitsiVoice';

interface JitsiVoicePanelProps {
  jitsi: JitsiVoiceState;
}

export default function JitsiVoicePanel({ jitsi }: JitsiVoicePanelProps) {
  const isActive = !!jitsi.activeRoom;

  return (
    <>
      {/* Container div is always in the DOM so Jitsi can mount into it */}
      <div
        id="jitsi-voice-container"
        style={{
          position: 'fixed', right: 0, top: 56, bottom: 0, zIndex: 75,
          width: 320,
          display: isActive && !jitsi.isCollapsed ? 'flex' : 'none',
          flexDirection: 'column',
          background: '#1a1a2e', boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
        }}
      />

      {/* Header overlay on top of the container */}
      {isActive && !jitsi.isCollapsed && (
        <div style={{
          position: 'fixed', right: 0, top: 56, zIndex: 76,
          width: 320,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '8px 12px', background: '#16213e', borderBottom: '1px solid #0f3460',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 600 }}>
              {jitsi.zoneName || '通話中'}
            </span>
            <span style={{ color: '#64748b', fontSize: 11 }}>{jitsi.participantCount}人</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={jitsi.toggleCollapse}
              style={{
                background: 'transparent', border: 'none', color: '#94a3b8',
                cursor: 'pointer', fontSize: 14, padding: '2px 6px', borderRadius: 4,
              }}
              title="折りたたむ"
            >
              ▶
            </button>
            <button
              onClick={jitsi.leaveRoom}
              style={{
                background: '#ef4444', border: 'none', borderRadius: 6,
                color: 'white', fontSize: 11, fontWeight: 600,
                padding: '3px 10px', cursor: 'pointer',
              }}
            >
              退出
            </button>
          </div>
        </div>
      )}

      {/* Collapsed pill */}
      {isActive && jitsi.isCollapsed && (
        <div
          onClick={jitsi.toggleCollapse}
          style={{
            position: 'fixed', right: 16, top: 64, zIndex: 75,
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', borderRadius: 20,
            background: '#1e293b', color: 'white', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)', fontSize: 12, fontWeight: 600,
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
          <span>{jitsi.zoneName || '通話中'}</span>
          <span style={{ color: '#94a3b8' }}>{jitsi.participantCount}人</span>
        </div>
      )}
    </>
  );
}
