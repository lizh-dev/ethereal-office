'use client';

import { useState, useRef, useCallback } from 'react';
import type { JitsiVoiceState } from '@/hooks/useJitsiVoice';

interface JitsiVoicePanelProps {
  jitsi: JitsiVoiceState;
}

export default function JitsiVoicePanel({ jitsi }: JitsiVoicePanelProps) {
  const isActive = !!jitsi.activeRoom;
  const [size, setSize] = useState<'normal' | 'large'>('normal');
  const [pos, setPos] = useState({ x: window.innerWidth - 370, y: 70 });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    const handleMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 200, dragRef.current.origX + ev.clientX - dragRef.current.startX)),
        y: Math.max(0, Math.min(window.innerHeight - 100, dragRef.current.origY + ev.clientY - dragRef.current.startY)),
      });
    };
    const handleUp = () => {
      dragRef.current = null;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [pos]);

  const w = size === 'large' ? 560 : 340;
  const h = size === 'large' ? 420 : 280;

  return (
    <>
      {/* Container is always in DOM for Jitsi to mount into */}
      <div
        style={{
          position: 'fixed',
          left: pos.x,
          top: pos.y,
          width: w,
          height: isActive && !jitsi.isCollapsed ? h : 0,
          zIndex: 80,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: isActive && !jitsi.isCollapsed ? '0 8px 32px rgba(0,0,0,0.25)' : 'none',
          transition: 'width 0.2s, height 0.2s',
          pointerEvents: isActive && !jitsi.isCollapsed ? 'auto' : 'none',
        }}
      >
        {/* Draggable header */}
        {isActive && !jitsi.isCollapsed && (
          <div
            onMouseDown={handleMouseDown}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '6px 10px', background: '#16213e', cursor: 'grab',
              borderBottom: '1px solid #0f3460', flexShrink: 0,
              userSelect: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
              <span style={{ color: '#e2e8f0', fontSize: 11, fontWeight: 600 }}>
                {jitsi.zoneName || '通話中'}
              </span>
              <span style={{ color: '#64748b', fontSize: 10 }}>{jitsi.participantCount}人</span>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => setSize(s => s === 'large' ? 'normal' : 'large')}
                style={{
                  background: 'transparent', border: 'none', color: '#94a3b8',
                  cursor: 'pointer', fontSize: 12, padding: '2px 4px', borderRadius: 4,
                }}
                title={size === 'large' ? '縮小' : '拡大'}
              >
                {size === 'large' ? '⊟' : '⊞'}
              </button>
              <button
                onClick={jitsi.toggleCollapse}
                style={{
                  background: 'transparent', border: 'none', color: '#94a3b8',
                  cursor: 'pointer', fontSize: 12, padding: '2px 4px', borderRadius: 4,
                }}
                title="最小化"
              >
                ▾
              </button>
              <button
                onClick={jitsi.leaveRoom}
                style={{
                  background: '#ef4444', border: 'none', borderRadius: 6,
                  color: 'white', fontSize: 10, fontWeight: 600,
                  padding: '2px 8px', cursor: 'pointer',
                }}
              >
                退出
              </button>
            </div>
          </div>
        )}

        {/* Jitsi iframe container */}
        <div id="jitsi-voice-container" style={{ flex: 1, background: '#1a1a2e' }} />
      </div>

      {/* Collapsed pill */}
      {isActive && jitsi.isCollapsed && (
        <div
          onClick={jitsi.toggleCollapse}
          style={{
            position: 'fixed', right: 16, bottom: 120, zIndex: 80,
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
