'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { PenTool, Download, Upload, Trash2, X, Users } from 'lucide-react';
import '@excalidraw/excalidraw/index.css';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';

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

  // Guard: floor and name are required (board must be opened from a floor)
  useEffect(() => {
    if (!floorSlug || !userName || userName === 'Guest') {
      window.location.href = '/';
    }
  }, [floorSlug, userName]);

  const [api, setApi] = useState<any>(null);
  const [userCount, setUserCount] = useState(1);
  const [isConnected, setIsConnected] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<HocuspocusProvider | null>(null);
  const isRemoteRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Setup Yjs + Hocuspocus (simple scene-level sync, no y-excalidraw)
  useEffect(() => {
    if (!api) return;

    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;
    const yScene = ydoc.getMap('scene');

    const hocuspocusUrl = process.env.NEXT_PUBLIC_HOCUSPOCUS_URL || `ws://${window.location.hostname}:3002`;
    const provider = new HocuspocusProvider({
      url: hocuspocusUrl,
      name: `board-${boardId}`,
      document: ydoc,
      onConnect: () => setIsConnected(true),
      onDisconnect: () => setIsConnected(false),
    });
    providerRef.current = provider;

    // Awareness for user count
    provider.awareness?.setLocalStateField('user', {
      name: userName,
      color: '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0'),
    });
    const updateCount = () => setUserCount(provider.awareness?.getStates().size || 1);
    provider.awareness?.on('change', updateCount);
    updateCount();

    // Load initial scene from Yjs
    provider.on('synced', ({ state }: { state: boolean }) => {
      if (!state) return;
      const stored = yScene.get('elements');
      if (stored && Array.isArray(stored) && stored.length > 0) {
        isRemoteRef.current = true;
        api.updateScene({ elements: stored });
        setTimeout(() => { isRemoteRef.current = false; }, 200);
      }
    });

    // Listen for remote scene updates
    yScene.observe((event) => {
      if (event.transaction.local) return;
      const elements = yScene.get('elements');
      if (elements && Array.isArray(elements)) {
        isRemoteRef.current = true;
        api.updateScene({ elements });
        setTimeout(() => { isRemoteRef.current = false; }, 200);
      }
    });

    return () => {
      provider.awareness?.off('change', updateCount);
      provider.destroy();
      providerRef.current = null;
      ydoc.destroy();
      ydocRef.current = null;
    };
  }, [api, boardId, userName]);

  // Debounced sync: local changes → Yjs
  const syncToYjs = useMemo(
    () => debounce((elements: any[]) => {
      if (!ydocRef.current || isRemoteRef.current) return;
      const yScene = ydocRef.current.getMap('scene');
      yScene.set('elements', elements);
    }, 300),
    []
  );

  const handleChange = useCallback((elements: readonly any[]) => {
    if (isRemoteRef.current) return;
    syncToYjs([...elements]);
  }, [syncToYjs]);

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
    a.download = `board-${boardId}-${new Date().toISOString().slice(0, 10)}.excalidraw`;
    a.click();
    URL.revokeObjectURL(url);
  }, [api, boardId]);

  const handleImport = useCallback(() => { fileInputRef.current?.click(); }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !api || !ydocRef.current) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.elements && Array.isArray(data.elements)) {
          // Update local Excalidraw
          api.updateScene({
            elements: data.elements,
            ...(data.appState?.viewBackgroundColor
              ? { appState: { viewBackgroundColor: data.appState.viewBackgroundColor } }
              : {}),
          });
          // Sync to Yjs immediately (not debounced) → other users get it
          const yScene = ydocRef.current!.getMap('scene');
          yScene.set('elements', data.elements);
        }
      } catch { /* invalid file */ }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [api]);

  const executeClear = useCallback(() => {
    if (!api || !ydocRef.current) return;
    api.resetScene();
    const yScene = ydocRef.current.getMap('scene');
    yScene.set('elements', []);
    setShowClearConfirm(false);
  }, [api]);

  const handleClose = useCallback(() => {
    try { window.close(); } catch {}
    if (floorSlug) {
      window.location.href = `/f/${floorSlug}`;
    } else {
      window.location.href = '/';
    }
  }, [floorSlug]);

  // Don't render if no floor context
  if (!floorSlug || !userName || userName === 'Guest') return null;

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: 'white' }}>
      <style>{`
        .layer-ui__wrapper__top-right { display: none !important; }
        .main-menu-trigger { display: none !important; }
      `}</style>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 16px', borderBottom: '1px solid #e2e8f0',
        background: '#f8fafc', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PenTool style={{ width: 16, height: 16, color: '#0f172a' }} strokeWidth={1.8} />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>ホワイトボード</span>
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
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input ref={fileInputRef} type="file" accept=".excalidraw,.json" onChange={handleFileChange} style={{ display: 'none' }} />
          <button onClick={handleImport} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '5px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
            background: 'white', color: '#475569', fontSize: 12, cursor: 'pointer',
          }}>
            <Upload style={{ width: 13, height: 13 }} strokeWidth={1.8} />
            インポート
          </button>
          <button onClick={handleExport} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '5px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
            background: 'white', color: '#475569', fontSize: 12, cursor: 'pointer',
          }}>
            <Download style={{ width: 13, height: 13 }} strokeWidth={1.8} />
            エクスポート
          </button>
          <button onClick={() => setShowClearConfirm(true)} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '5px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
            background: 'white', color: '#ef4444', fontSize: 12, cursor: 'pointer',
          }}>
            <Trash2 style={{ width: 13, height: 13 }} strokeWidth={1.8} />
            クリア
          </button>
          <button onClick={handleClose} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '5px 12px', borderRadius: 8, border: 'none',
            background: '#64748b', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>
            <X style={{ width: 13, height: 13 }} strokeWidth={2} />
            閉じる
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
        <div style={{ position: 'absolute', inset: 0 }}>
          <Excalidraw
            excalidrawAPI={(excalidrawApi: any) => setApi(excalidrawApi)}
            onChange={handleChange}
            isCollaborating={isConnected}
            langCode="ja-JP"
            initialData={{ elements: [], appState: { viewBackgroundColor: '#ffffff' } }}
            UIOptions={{
              canvasActions: {
                loadScene: false,
                export: false,
                saveAsImage: false,
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
