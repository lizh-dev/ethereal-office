'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const Excalidraw = dynamic(
  () => import('@excalidraw/excalidraw').then(mod => mod.Excalidraw),
  { ssr: false }
);

function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as unknown as T;
}

export default function BoardPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const boardId = params.id as string;
  const userName = searchParams.get('name') || 'Guest';
  const floorSlug = searchParams.get('floor') || '';

  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const isRemoteUpdateRef = useRef(false);
  const lastSentRef = useRef<string>('');
  const wsRef = useRef<WebSocket | null>(null);

  // Connect to the floor's WebSocket for board sync
  useEffect(() => {
    if (!floorSlug) return;
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `ws://${window.location.hostname}:8080/ws`;
    const ws = new WebSocket(
      `${wsUrl}?floor=${encodeURIComponent(floorSlug)}&name=${encodeURIComponent(userName)}&avatar=notionists&seed=board-user&userId=board-${boardId.slice(0, 8)}`
    );
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'board_updated' && msg.meetingId === boardId && excalidrawAPI) {
          const data = JSON.parse(msg.boardData);
          isRemoteUpdateRef.current = true;
          excalidrawAPI.updateScene({ elements: data.elements });
          if (data.files && typeof data.files === 'object') {
            const fileArray = Object.values(data.files);
            if (fileArray.length > 0) {
              excalidrawAPI.addFiles(fileArray);
            }
          }
          setTimeout(() => { isRemoteUpdateRef.current = false; }, 100);
        }
      } catch { /* ignore */ }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [floorSlug, boardId, excalidrawAPI, userName]);

  const debouncedSend = useMemo(
    () => debounce((data: string) => {
      if (data === lastSentRef.current) return;
      lastSentRef.current = data;
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'board_update',
          meetingId: boardId,
          boardData: data,
        }));
      }
    }, 500),
    [boardId]
  );

  const handleChange = useCallback((elements: readonly any[], _appState: any, files: any) => {
    if (isRemoteUpdateRef.current) return;
    const fileEntries: Record<string, any> = {};
    if (files) {
      for (const [key, file] of Object.entries(files)) {
        const f = file as any;
        if (f && f.dataURL) {
          fileEntries[key] = { id: f.id, dataURL: f.dataURL, mimeType: f.mimeType, created: f.created };
        }
      }
    }
    const hasFiles = Object.keys(fileEntries).length > 0;
    debouncedSend(JSON.stringify({ elements, ...(hasFiles ? { files: fileEntries } : {}) }));
  }, [debouncedSend]);

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

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: 'white' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 16px', borderBottom: '1px solid #e2e8f0',
        background: '#f8fafc', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>📝</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>ホワイトボード</span>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>共同編集</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleExport} style={{
            padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0',
            background: 'white', color: '#475569', fontSize: 12, cursor: 'pointer',
          }}>
            保存
          </button>
          <button onClick={() => window.close()} style={{
            padding: '6px 14px', borderRadius: 8, border: 'none',
            background: '#ef4444', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer',
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
          langCode="ja-JP"
        />
      </div>
    </div>
  );
}
