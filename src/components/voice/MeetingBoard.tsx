'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useWsSend } from '@/contexts/WebSocketContext';

function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as unknown as T;
}

const Excalidraw = dynamic(
  () => import('@excalidraw/excalidraw').then(mod => mod.Excalidraw),
  { ssr: false }
);

interface MeetingBoardProps {
  meetingId: string;
  onClose: () => void;
}

export default function MeetingBoard({ meetingId, onClose }: MeetingBoardProps) {
  const wsSend = useWsSend();
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const isRemoteUpdateRef = useRef(false);
  const lastSentRef = useRef<string>('');
  const [size, setSize] = useState<'normal' | 'large'>('normal');
  const [pos, setPos] = useState({ x: 60, y: 80 });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  // Drag handling
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

  // Listen for remote board updates via WebSocket
  useEffect(() => {
    const handleWsMessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'board_updated' && msg.meetingId === meetingId && excalidrawAPI) {
          const data = JSON.parse(msg.boardData);
          isRemoteUpdateRef.current = true;
          excalidrawAPI.updateScene({ elements: data.elements });
          setTimeout(() => { isRemoteUpdateRef.current = false; }, 100);
        }
      } catch { /* ignore */ }
    };

    window.addEventListener('ws-board-update', handleWsMessage as any);
    return () => window.removeEventListener('ws-board-update', handleWsMessage as any);
  }, [meetingId, excalidrawAPI]);

  // Debounced send — only transmit every 500ms at most
  const debouncedSend = useMemo(
    () => debounce((data: string) => {
      if (data === lastSentRef.current) return;
      lastSentRef.current = data;
      wsSend.boardUpdate?.(meetingId, data);
    }, 500),
    [meetingId, wsSend]
  );

  const handleChange = useCallback((elements: readonly any[]) => {
    if (isRemoteUpdateRef.current) return;
    debouncedSend(JSON.stringify({ elements }));
  }, [isRemoteUpdateRef, debouncedSend]);

  const handleExport = () => {
    if (!excalidrawAPI) return;
    const elements = excalidrawAPI.getSceneElements();
    const data = JSON.stringify({ elements }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `board-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const w = size === 'large' ? 800 : 520;
  const h = size === 'large' ? 560 : 380;

  return (
    <div style={{
      position: 'fixed', left: pos.x, top: pos.y,
      width: w, height: h, zIndex: 85,
      borderRadius: 14, overflow: 'hidden',
      boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
      display: 'flex', flexDirection: 'column',
      background: 'white', border: '1px solid #e2e8f0',
      transition: 'width 0.2s, height 0.2s',
    }}>
      {/* Header — draggable */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '6px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
          cursor: 'grab', userSelect: 'none', flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14 }}>📝</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>ホワイトボード</span>
          <span style={{ fontSize: 10, color: '#94a3b8' }}>共同編集</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={handleExport} style={{
            padding: '2px 8px', borderRadius: 6, border: '1px solid #e2e8f0',
            background: 'white', color: '#475569', fontSize: 10, cursor: 'pointer',
          }}>
            保存
          </button>
          <button
            onClick={() => setSize(s => s === 'large' ? 'normal' : 'large')}
            style={{
              background: 'transparent', border: 'none', color: '#94a3b8',
              cursor: 'pointer', fontSize: 12, padding: '2px 4px',
            }}
            title={size === 'large' ? '縮小' : '拡大'}
          >
            {size === 'large' ? '⊟' : '⊞'}
          </button>
          <button onClick={onClose} style={{
            padding: '2px 8px', borderRadius: 6, border: 'none',
            background: '#64748b', color: 'white', fontSize: 10, fontWeight: 600, cursor: 'pointer',
          }}>
            ✕
          </button>
        </div>
      </div>

      {/* Excalidraw Canvas */}
      <div style={{ flex: 1 }}>
        <Excalidraw
          excalidrawAPI={(api: any) => setExcalidrawAPI(api)}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}
