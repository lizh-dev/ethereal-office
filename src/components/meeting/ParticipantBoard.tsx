'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { PenTool, Download, Upload, Trash2, Users } from 'lucide-react';
import '@excalidraw/excalidraw/index.css';
import { useParticipantBoard } from '@/hooks/useParticipantBoard';

const Excalidraw = dynamic(
  () => import('@excalidraw/excalidraw').then(mod => mod.Excalidraw),
  { ssr: false }
);

interface ParticipantBoardProps {
  meetingId: string;
  participantId: string;
  floorSlug: string;
  userName: string;
  userId: string;
  isHost: boolean;
  isRedPen: boolean;
  visible: boolean;
}

export default function ParticipantBoard({
  meetingId, participantId, floorSlug, userName, userId, isHost, isRedPen, visible,
}: ParticipantBoardProps) {
  const {
    api, setApi, isConnected, userCount, handleChange, ydocRef, syncToYjs,
  } = useParticipantBoard({ meetingId, participantId, floorSlug, userName, userId, isHost, isRedPen });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Flush pending sync when hiding the board
  useEffect(() => {
    if (!visible) syncToYjs.flush();
  }, [visible, syncToYjs]);

  const handleExport = useCallback(() => {
    if (!api) return;
    const elements = api.getSceneElements();
    const appState = api.getAppState();
    const data = JSON.stringify({
      type: 'excalidraw',
      version: 2,
      source: 'smartoffice-board',
      elements,
      appState: {
        viewBackgroundColor: appState.viewBackgroundColor || '#ffffff',
        gridSize: appState.gridSize || null,
      },
      files: {},
    }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `board-${participantId}-${new Date().toISOString().slice(0, 10)}.excalidraw`;
    a.click();
    URL.revokeObjectURL(url);
  }, [api, participantId]);

  const handleImport = useCallback(() => { fileInputRef.current?.click(); }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !api || !ydocRef.current) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.elements && Array.isArray(data.elements)) {
          api.updateScene({
            elements: data.elements,
            ...(data.appState?.viewBackgroundColor
              ? { appState: { viewBackgroundColor: data.appState.viewBackgroundColor } }
              : {}),
          });
          const yScene = ydocRef.current!.getMap('scene');
          yScene.set('elements', data.elements);
        }
      } catch { /* invalid file */ }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [api, ydocRef]);

  const executeClear = useCallback(() => {
    if (!api || !ydocRef.current) return;
    api.resetScene();
    const yScene = ydocRef.current.getMap('scene');
    yScene.set('elements', []);
    setShowClearConfirm(false);
  }, [api, ydocRef]);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '6px 12px', borderBottom: '1px solid #e2e8f0',
        background: '#f8fafc', flexShrink: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PenTool style={{ width: 14, height: 14, color: '#0f172a' }} strokeWidth={1.8} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>ボード</span>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '2px 8px', borderRadius: 12,
            background: isConnected ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${isConnected ? '#bbf7d0' : '#fecaca'}`,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: isConnected ? '#22c55e' : '#ef4444' }} />
            <span style={{ fontSize: 11, color: isConnected ? '#16a34a' : '#dc2626' }}>
              {isConnected ? '接続中' : '未接続'}
            </span>
          </div>
          {userCount > 1 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 3,
              padding: '2px 8px', borderRadius: 12,
              background: '#eff6ff', border: '1px solid #bfdbfe',
            }}>
              <Users style={{ width: 12, height: 12, color: '#3b82f6' }} strokeWidth={1.8} />
              <span style={{ fontSize: 11, color: '#2563eb' }}>{userCount}人</span>
            </div>
          )}
          {isHost && isRedPen && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '2px 8px', borderRadius: 12,
              background: '#fef2f2', border: '1px solid #fecaca',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>赤ペンモード</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input ref={fileInputRef} type="file" accept=".excalidraw,.json" onChange={handleFileChange} style={{ display: 'none' }} />
          <button onClick={handleImport} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 8, border: '1px solid #e2e8f0',
            background: 'white', color: '#475569', fontSize: 12, cursor: 'pointer',
          }}>
            <Upload style={{ width: 13, height: 13 }} strokeWidth={1.8} />
            インポート
          </button>
          <button onClick={handleExport} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 8, border: '1px solid #e2e8f0',
            background: 'white', color: '#475569', fontSize: 12, cursor: 'pointer',
          }}>
            <Download style={{ width: 13, height: 13 }} strokeWidth={1.8} />
            エクスポート
          </button>
          <button onClick={() => setShowClearConfirm(true)} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 8, border: '1px solid #e2e8f0',
            background: 'white', color: '#ef4444', fontSize: 12, cursor: 'pointer',
          }}>
            <Trash2 style={{ width: 13, height: 13 }} strokeWidth={1.8} />
            クリア
          </button>
        </div>
      </div>

      {/* Clear confirmation */}
      {showClearConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }} onClick={() => setShowClearConfirm(false)}>
          <div style={{
            background: 'white', borderRadius: 16, padding: 24, maxWidth: 360,
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }} onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>ボードをクリア</p>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>すべての描画内容が消去されます。この操作は元に戻せません。</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowClearConfirm(false)} style={{
                padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0',
                background: 'white', color: '#475569', fontSize: 13, cursor: 'pointer',
              }}>キャンセル</button>
              <button onClick={executeClear} style={{
                padding: '8px 16px', borderRadius: 8, border: 'none',
                background: '#ef4444', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>消去する</button>
            </div>
          </div>
        </div>
      )}

      {/* Excalidraw Canvas */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <style>{`
          .layer-ui__wrapper__top-right { display: none !important; }
          .main-menu-trigger { display: none !important; }
        `}</style>
        <div style={{ position: 'absolute', inset: 0 }}>
          <Excalidraw
            excalidrawAPI={(excalidrawApi: any) => setApi(excalidrawApi)}
            onChange={handleChange}
            isCollaborating={isConnected}
            langCode="ja-JP"
            initialData={{ elements: [], appState: { viewBackgroundColor: '#ffffff' } }}
            UIOptions={{
              canvasActions: { loadScene: false, export: false, saveAsImage: false },
            }}
          />
        </div>
      </div>
    </div>
  );
}
