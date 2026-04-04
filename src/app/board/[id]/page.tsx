'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { PenTool, Download, Upload, Trash2, X, Users } from 'lucide-react';
import '@excalidraw/excalidraw/index.css';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { ExcalidrawBinding, yjsToExcalidraw } from 'y-excalidraw';

const Excalidraw = dynamic(
  () => import('@excalidraw/excalidraw').then(mod => mod.Excalidraw),
  { ssr: false }
);

export default function BoardPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const boardId = params.id as string;
  const userName = searchParams.get('name') || 'Guest';

  const [api, setApi] = useState<any>(null);
  const [userCount, setUserCount] = useState(1);
  const [isConnected, setIsConnected] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<HocuspocusProvider | null>(null);
  const bindingRef = useRef<ExcalidrawBinding | null>(null);

  // Setup Yjs + Hocuspocus + ExcalidrawBinding
  useEffect(() => {
    if (!api) return;

    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const yElements = ydoc.getArray<Y.Map<any>>('elements');
    const yAssets = ydoc.getMap('assets');

    const hocuspocusUrl = process.env.NEXT_PUBLIC_HOCUSPOCUS_URL || `ws://${window.location.hostname}:3002`;

    const provider = new HocuspocusProvider({
      url: hocuspocusUrl,
      name: `board-${boardId}`,
      document: ydoc,
      onConnect: () => setIsConnected(true),
      onDisconnect: () => setIsConnected(false),
    });
    providerRef.current = provider;

    // Set awareness (user info for cursor sharing)
    provider.awareness?.setLocalStateField('user', {
      name: userName,
      color: '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0'),
    });

    // Track connected user count
    const updateUserCount = () => {
      const states = provider.awareness?.getStates();
      setUserCount(states?.size || 1);
    };
    provider.awareness?.on('change', updateUserCount);
    updateUserCount();

    // Wait for initial sync before binding
    const onSync = (synced: boolean) => {
      if (!synced) return;

      // Load initial elements from Yjs to Excalidraw
      const elements = yjsToExcalidraw(yElements);
      if (elements.length > 0) {
        api.updateScene({ elements });
      }

      // Create binding
      const binding = new ExcalidrawBinding(
        yElements,
        yAssets,
        api,
        provider.awareness ?? undefined,
      );
      bindingRef.current = binding;
    };

    provider.on('synced', onSync);

    return () => {
      bindingRef.current?.destroy();
      bindingRef.current = null;
      provider.awareness?.off('change', updateUserCount);
      provider.off('synced', onSync);
      provider.destroy();
      providerRef.current = null;
      ydoc.destroy();
      ydocRef.current = null;
    };
  }, [api, boardId, userName]);

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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !api || !ydocRef.current) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.elements && Array.isArray(data.elements)) {
          // Update Excalidraw locally
          api.updateScene({ elements: data.elements });
          if (data.appState?.viewBackgroundColor) {
            api.updateScene({ appState: { viewBackgroundColor: data.appState.viewBackgroundColor } });
          }
          // Sync to Yjs so other users see the import
          const ydoc = ydocRef.current!;
          const yElements = ydoc.getArray<Y.Map<any>>('elements');
          ydoc.transact(() => {
            yElements.delete(0, yElements.length);
            for (const el of data.elements) {
              const yEl = new Y.Map<any>();
              for (const [key, value] of Object.entries(el)) {
                yEl.set(key, value);
              }
              yElements.push([yEl]);
            }
          });
        }
      } catch { /* invalid file */ }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [api]);

  const executeClear = useCallback(() => {
    if (!api || !ydocRef.current) return;
    const yElements = ydocRef.current.getArray('elements');
    ydocRef.current.transact(() => {
      yElements.delete(0, yElements.length);
    });
    api.resetScene();
    setShowClearConfirm(false);
  }, [api]);

  const handleClose = useCallback(() => {
    // window.close() only works for JS-opened tabs
    try { window.close(); } catch {}
    // Fallback: navigate to floor or home
    const floorSlug = new URLSearchParams(window.location.search).get('floor');
    if (floorSlug) {
      window.location.href = `/f/${floorSlug}`;
    } else {
      window.location.href = '/';
    }
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: 'white' }}>
      {/* Hide Excalidraw's built-in library button and hamburger menu */}
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
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: isConnected ? '#22c55e' : '#ef4444',
            }} />
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
          }} title="ファイルからインポート">
            <Upload style={{ width: 13, height: 13 }} strokeWidth={1.8} />
            インポート
          </button>
          <button onClick={handleExport} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '5px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
            background: 'white', color: '#475569', fontSize: 12, cursor: 'pointer',
          }} title="ファイルとしてエクスポート">
            <Download style={{ width: 13, height: 13 }} strokeWidth={1.8} />
            エクスポート
          </button>
          <button onClick={() => setShowClearConfirm(true)} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '5px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
            background: 'white', color: '#ef4444', fontSize: 12, cursor: 'pointer',
          }} title="ボードをクリア">
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
            <p style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
              ボードをクリア
            </p>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
              すべての描画内容が消去されます。この操作は元に戻せません。
            </p>
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
          isCollaborating={isConnected}
          langCode="ja-JP"
          initialData={{ elements: [], appState: { viewBackgroundColor: '#ffffff' } }}
          onPointerUpdate={bindingRef.current?.onPointerUpdate}
          UIOptions={{
            canvasActions: {
              loadScene: false,
              export: false,
              saveAsImage: false,
            },
          }}
          renderTopRightUI={() => null}
        />
        </div>
      </div>
    </div>
  );
}
