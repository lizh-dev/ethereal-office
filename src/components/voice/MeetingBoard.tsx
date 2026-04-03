'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useWsSend } from '@/contexts/WebSocketContext';
import { useOfficeStore } from '@/store/officeStore';

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

  // Listen for remote board updates via WebSocket
  useEffect(() => {
    const handleWsMessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'board_updated' && msg.meetingId === meetingId && excalidrawAPI) {
          const data = JSON.parse(msg.boardData);
          isRemoteUpdateRef.current = true;
          excalidrawAPI.updateScene({
            elements: data.elements,
          });
          setTimeout(() => { isRemoteUpdateRef.current = false; }, 100);
        }
      } catch { /* ignore */ }
    };

    // We can't directly access the WebSocket from here, so we'll use a global event
    window.addEventListener('ws-board-update', handleWsMessage as any);
    return () => window.removeEventListener('ws-board-update', handleWsMessage as any);
  }, [meetingId, excalidrawAPI]);

  const handleChange = useCallback((elements: readonly any[]) => {
    if (isRemoteUpdateRef.current) return;

    const data = JSON.stringify({ elements });
    if (data === lastSentRef.current) return;
    lastSentRef.current = data;

    // Send via WebSocket (throttled)
    wsSend.boardUpdate?.(meetingId, data);
  }, [meetingId, wsSend]);

  const handleExport = () => {
    if (!excalidrawAPI) return;
    const elements = excalidrawAPI.getSceneElements();
    const data = JSON.stringify({ elements }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-board-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 85,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: '92vw', maxWidth: 1100, height: '85vh',
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        display: 'flex', flexDirection: 'column',
        background: 'white',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '8px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>&#x1F4DD;</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>共有ボード</span>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>リアルタイム共同編集</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleExport} style={{
              padding: '4px 12px', borderRadius: 6, border: '1px solid #e2e8f0',
              background: 'white', color: '#475569', fontSize: 11, fontWeight: 500, cursor: 'pointer',
            }}>
              エクスポート
            </button>
            <button onClick={onClose} style={{
              padding: '4px 12px', borderRadius: 6, border: 'none',
              background: '#64748b', color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer',
            }}>
              閉じる
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
    </div>
  );
}
