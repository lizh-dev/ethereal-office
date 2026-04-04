'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { PenTool, Video, X, Download, Upload, Trash2, Users } from 'lucide-react';
import ParticipantBoard from '@/components/meeting/ParticipantBoard';
import HostBoardPanel from '@/components/meeting/HostBoardPanel';
import '@excalidraw/excalidraw/index.css';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';

const Excalidraw = dynamic(
  () => import('@excalidraw/excalidraw').then(mod => mod.Excalidraw),
  { ssr: false }
);

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T & { flush: () => void } {
  let timer: ReturnType<typeof setTimeout>;
  let lastArgs: any[] | null = null;
  const debounced = ((...args: any[]) => {
    lastArgs = args;
    clearTimeout(timer);
    timer = setTimeout(() => { lastArgs = null; fn(...args); }, ms);
  }) as unknown as T & { flush: () => void };
  debounced.flush = () => {
    if (lastArgs) {
      clearTimeout(timer);
      const args = lastArgs;
      lastArgs = null;
      fn(...args);
    }
  };
  return debounced;
}

// ---------- Inline Board Component ----------
function MeetingBoard({ roomId, floorSlug, userName, visible }: { roomId: string; floorSlug: string; userName: string; visible: boolean }) {
  const [api, setApi] = useState<any>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<HocuspocusProvider | null>(null);
  const isRemoteRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userCount, setUserCount] = useState(1);
  const [isConnected, setIsConnected] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    if (!api) return;

    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;
    const yScene = ydoc.getMap('scene');

    const hocuspocusUrl = process.env.NEXT_PUBLIC_HOCUSPOCUS_URL || `ws://${window.location.hostname}:3002`;
    const provider = new HocuspocusProvider({
      url: hocuspocusUrl,
      name: `board-${roomId}`,
      document: ydoc,
      token: JSON.stringify({ floor: floorSlug, boardId: roomId }),
      onConnect: () => setIsConnected(true),
      onDisconnect: () => setIsConnected(false),
    });
    providerRef.current = provider;

    provider.awareness?.setLocalStateField('user', {
      name: userName,
      color: '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0'),
    });
    const updateCount = () => setUserCount(provider.awareness?.getStates().size || 1);
    provider.awareness?.on('change', updateCount);
    updateCount();

    provider.on('synced', ({ state }: { state: boolean }) => {
      if (!state) return;
      const stored = yScene.get('elements');
      if (stored && Array.isArray(stored) && stored.length > 0) {
        isRemoteRef.current = true;
        api.updateScene({ elements: stored });
        setTimeout(() => { isRemoteRef.current = false; }, 200);
      }
    });

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
  }, [api, roomId, userName, floorSlug]);

  const syncToYjs = useMemo(
    () => debounce((elements: any[]) => {
      if (!ydocRef.current || isRemoteRef.current) return;
      const yScene = ydocRef.current.getMap('scene');
      yScene.set('elements', elements);
    }, 300),
    []
  );

  // Flush pending sync when hiding the board
  useEffect(() => {
    if (!visible) syncToYjs.flush();
  }, [visible, syncToYjs]);

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
    a.download = `meeting-board-${roomId}-${new Date().toISOString().slice(0, 10)}.excalidraw`;
    a.click();
    URL.revokeObjectURL(url);
  }, [api, roomId]);

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
  }, [api]);

  const executeClear = useCallback(() => {
    if (!api || !ydocRef.current) return;
    api.resetScene();
    const yScene = ydocRef.current.getMap('scene');
    yScene.set('elements', []);
    setShowClearConfirm(false);
  }, [api]);

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

// ---------- Main ----------
export default function MeetingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const decodedRoomId = decodeURIComponent(roomId);
  const nameFromUrl = searchParams.get('name') || '';
  const uidFromUrl = searchParams.get('uid') || '';
  const floorSlug = decodedRoomId.split('-')[0] || '';

  const [storedPw] = useState(() => {
    if (typeof window === 'undefined') return '';
    try {
      const pw = localStorage.getItem(`meeting-pw-${decodedRoomId}`) || '';
      if (pw) localStorage.removeItem(`meeting-pw-${decodedRoomId}`);
      return pw;
    } catch { return ''; }
  });

  const [userName, setUserName] = useState(nameFromUrl);
  const [password, setPassword] = useState('');
  const [gateError, setGateError] = useState('');
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');
  const [roomValid, setRoomValid] = useState<boolean | null>(null);
  const [roomHasPassword, setRoomHasPassword] = useState(false);
  const [showBoard, setShowBoard] = useState(false);
  const [boardMounted, setBoardMounted] = useState(false);
  const [canInlineBoard, setCanInlineBoard] = useState(false);
  const [individualBoard, setIndividualBoard] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [isRedPen, setIsRedPen] = useState(false);

  const autoJoin = !!nameFromUrl;
  const containerRef = useRef<HTMLDivElement>(null);
  const jitsiRef = useRef<any>(null);
  const leftNotifiedRef = useRef(false);

  const ibFromUrl = searchParams.get('ib') === '1';

  // Check if floor has Pro plan (for inline board permission)
  useEffect(() => {
    if (!floorSlug) return;
    fetch(`/api/floors/${encodeURIComponent(floorSlug)}/permissions`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.permissions?.meetingInlineBoard) {
          setCanInlineBoard(true);
        }
      })
      .catch(() => {});
  }, [floorSlug]);

  // Check meeting info for individual board mode & host status
  useEffect(() => {
    if (!joined || !decodedRoomId || !floorSlug) return;
    fetch(`/api/meetings/${encodeURIComponent(decodedRoomId)}/info?floor=${encodeURIComponent(floorSlug)}&userId=${encodeURIComponent(uidFromUrl || nameFromUrl)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.exists) {
          setIsHost(!!data.isHost);
          if (data.individualBoard || ibFromUrl) {
            setIndividualBoard(true);
          }
        }
      })
      .catch(() => {
        if (ibFromUrl) setIndividualBoard(true);
      });
  }, [joined, decodedRoomId, floorSlug, uidFromUrl, nameFromUrl, ibFromUrl]);

  const notifyLeave = () => {
    if (leftNotifiedRef.current) return;
    leftNotifiedRef.current = true;
    const body = JSON.stringify({ meetingId: decodedRoomId, userId: uidFromUrl || nameFromUrl || 'unknown', floorSlug });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/meetings/leave', new Blob([body], { type: 'application/json' }));
    } else {
      fetch('/api/meetings/leave', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {});
    }
  };

  useEffect(() => {
    if (!joined || !roomId) return;

    const initJitsi = () => {
      if (!containerRef.current || jitsiRef.current) return;
      try {
        const jitsiDomain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'localhost:8443';
        jitsiRef.current = new window.JitsiMeetExternalAPI(jitsiDomain, {
          roomName: roomId,
          parentNode: containerRef.current,
          width: '100%',
          height: '100%',
          lang: 'ja',
          userInfo: { displayName: userName },
          configOverwrite: {
            startWithAudioMuted: true,
            startWithVideoMuted: true,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            defaultLanguage: 'ja',
            toolbarButtons: ['microphone', 'camera', 'desktop', 'chat', 'raisehand', 'tileview'],
            hideConferenceSubject: true,
            notifications: [],
            disableThirdPartyRequests: true,
            p2p: { enabled: true },
            enableWelcomePage: false,
            enableClosePage: false,
            feedbackPercentage: 0,
            channelLastN: -1,
            hideAddRoomButton: true,
            breakoutRooms: { hideAddRoomButton: true },
            remoteVideoMenu: { disableKick: true, disableGrantModerator: true },
            buttonsWithNotifyClick: ['hangup'],
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            SHOW_POWERED_BY: false,
            DEFAULT_REMOTE_DISPLAY_NAME: 'ゲスト',
            TOOLBAR_ALWAYS_VISIBLE: true,
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            HIDE_INVITE_MORE_HEADER: true,
            APP_NAME: 'SmartOffice Meeting',
            NATIVE_APP_NAME: 'SmartOffice',
            PROVIDER_NAME: 'SmartOffice',
            SHOW_CHROME_EXTENSION_BANNER: false,
          },
        });

        const meetingPassword = storedPw || password;
        if (meetingPassword) {
          jitsiRef.current.addListener('videoConferenceJoined', () => {
            jitsiRef.current.executeCommand('password', meetingPassword);
          });
        }

        jitsiRef.current.addListener('toolbarButtonClicked', (key: string) => {
          if (key === 'hangup') jitsiRef.current.executeCommand('hangup');
        });

        jitsiRef.current.addListener('readyToClose', () => {
          notifyLeave();
          window.close();
          setTimeout(() => window.history.back(), 200);
        });
      } catch {
        setError('ミーティングの接続に失敗しました。');
      }
    };

    if (window.JitsiMeetExternalAPI) {
      initJitsi();
    } else {
      const script = document.createElement('script');
      script.src = '/jitsi/external_api.js';
      script.async = true;
      script.onload = initJitsi;
      script.onerror = () => setError('ミーティングシステムの読み込みに失敗しました。');
      document.head.appendChild(script);
    }

    const handleBeforeUnload = () => notifyLeave();
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (jitsiRef.current) {
        jitsiRef.current.dispose();
        jitsiRef.current = null;
      }
    };
  }, [joined, roomId, userName, storedPw]);

  useEffect(() => {
    if (autoJoin) { setRoomValid(true); return; }
    const slugPart = roomId.split('-')[0] || '';
    fetch(`/api/meetings/${encodeURIComponent(roomId)}/check?floor=${encodeURIComponent(slugPart)}`)
      .then(r => r.json())
      .then(data => { setRoomValid(!!data.exists); setRoomHasPassword(!!data.hasPassword); })
      .catch(() => setRoomValid(false));
  }, [roomId, autoJoin]);

  // Auto-join: register participant via verify-password API then join
  useEffect(() => {
    if (!autoJoin || !userName || !roomValid) return;
    fetch('/api/meetings/verify-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meetingId: decodedRoomId, password: storedPw || '', userId: uidFromUrl || userName, floorSlug }),
    })
      .catch(() => {})
      .finally(() => setJoined(true));
  }, [autoJoin, userName, roomValid, decodedRoomId, uidFromUrl, floorSlug, storedPw]);

  if (error) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a2e', color: '#e2e8f0', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 16 }}>{error}</p>
          <button onClick={() => window.close()} style={{ marginTop: 16, padding: '8px 20px', borderRadius: 8, border: 'none', background: '#0ea5e9', color: 'white', fontSize: 14, cursor: 'pointer' }}>閉じる</button>
        </div>
      </div>
    );
  }

  if (roomValid === null) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#e2e8f0', fontFamily: 'sans-serif' }}>
        <p style={{ fontSize: 14 }}>ミーティングルームを確認中...</p>
      </div>
    );
  }

  if (roomValid === false) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', fontFamily: 'sans-serif' }}>
        <div style={{ background: 'white', borderRadius: 16, padding: 32, width: 340, boxShadow: '0 8px 32px rgba(0,0,0,0.3)', textAlign: 'center' }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>ミーティングが見つかりません</p>
          <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 20px' }}>このミーティングルームは存在しないか、既に終了しています。</p>
          <button onClick={() => { window.close(); window.history.back(); }} style={{ width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', background: '#0ea5e9', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>戻る</button>
        </div>
      </div>
    );
  }

  if (!joined) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', fontFamily: 'sans-serif' }}>
        <div style={{ background: 'white', borderRadius: 16, padding: 32, width: 340, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 4px', textAlign: 'center' }}>ミーティングに参加</h2>
          <p style={{ fontSize: 12, color: '#64748b', textAlign: 'center', margin: '0 0 20px' }}>名前を入力してください</p>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#475569', marginBottom: 4 }}>表示名 *</label>
            <input type="text" value={userName} onChange={e => setUserName(e.target.value)} placeholder="名前を入力" autoFocus
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          {roomHasPassword && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#475569', marginBottom: 4 }}>パスワード（設定されている場合）</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="パスワードを入力"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          )}
          {gateError && <p style={{ color: '#ef4444', fontSize: 12, margin: '0 0 8px' }}>{gateError}</p>}
          <button
            onClick={async () => {
              if (!userName.trim()) return;
              setGateError('');
              try {
                const res = await fetch('/api/meetings/verify-password', {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ meetingId: decodedRoomId, password, userId: userName.trim(), floorSlug }),
                });
                const data = await res.json();
                if (!data.allowed) { setGateError(data.reason || '参加できません'); return; }
              } catch { /* allow */ }
              setJoined(true);
            }}
            disabled={!userName.trim()}
            style={{ width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', background: userName.trim() ? '#0ea5e9' : '#cbd5e1', color: 'white', fontSize: 14, fontWeight: 600, cursor: userName.trim() ? 'pointer' : 'default' }}
          >参加する</button>
        </div>
      </div>
    );
  }

  const handleLeave = () => {
    notifyLeave();
    if (jitsiRef.current) { jitsiRef.current.dispose(); jitsiRef.current = null; }
    window.close();
    setTimeout(() => window.history.back(), 200);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a2e', position: 'relative' }}>
      {/* Jitsi container — PiP when board is shown (audio+video continue) */}
      <div
        ref={containerRef}
        style={showBoard ? {
          position: 'fixed', bottom: 60, left: 16, width: 340, height: 220,
          zIndex: 60, borderRadius: 12, overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)', border: '2px solid #334155',
        } : {
          width: '100%', height: '100%',
        }}
      />

      {/* Excalidraw board — stays mounted once opened, hidden via CSS to preserve Yjs connection */}
      {boardMounted && (
        <div style={{
          width: '100%', height: '100%', background: 'white',
          position: 'absolute', inset: 0, zIndex: 50,
          display: showBoard ? 'flex' : 'none', flexDirection: 'row',
        }}>
          <style>{`
            .layer-ui__wrapper__top-right { display: none !important; }
            .main-menu-trigger { display: none !important; }
          `}</style>

          {/* Individual board mode: host gets sidebar + participant board */}
          {individualBoard && canInlineBoard ? (
            <>
              {isHost && (
                <HostBoardPanel
                  meetingId={decodedRoomId}
                  floorSlug={floorSlug}
                  userId={uidFromUrl || nameFromUrl}
                  userName={userName}
                  selectedParticipantId={selectedParticipantId}
                  onSelectParticipant={(id) => { setSelectedParticipantId(id); setIsRedPen(false); }}
                  isRedPen={isRedPen}
                  onToggleRedPen={() => setIsRedPen(v => !v)}
                />
              )}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <ParticipantBoard
                  meetingId={decodedRoomId}
                  participantId={selectedParticipantId || uidFromUrl || nameFromUrl}
                  floorSlug={floorSlug}
                  userName={userName}
                  userId={uidFromUrl || nameFromUrl}
                  isHost={isHost}
                  isRedPen={isRedPen && selectedParticipantId !== null && selectedParticipantId !== (uidFromUrl || nameFromUrl)}
                  visible={showBoard}
                />
              </div>
            </>
          ) : (
            /* Shared board mode (default) */
            <MeetingBoard roomId={decodedRoomId} floorSlug={floorSlug} userName={userName} visible={showBoard} />
          )}
        </div>
      )}

      {/* Bottom control bar */}
      <div style={{
        position: 'fixed', bottom: 16, right: 16, zIndex: 100,
        display: 'flex', gap: 8, alignItems: 'center',
      }}>
        {/* Board toggle — Pro only */}
        {canInlineBoard && (
          <button
            onClick={() => { setBoardMounted(true); setShowBoard(v => !v); }}
            style={{
              padding: '8px 16px', borderRadius: 10, border: 'none',
              background: showBoard ? '#0ea5e9' : 'rgba(255,255,255,0.15)',
              color: 'white', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: showBoard ? '0 4px 12px rgba(14,165,233,0.4)' : '0 4px 12px rgba(0,0,0,0.3)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {showBoard ? (
              <><Video style={{ width: 15, height: 15 }} strokeWidth={2} /> 会議に戻る</>
            ) : (
              <><PenTool style={{ width: 15, height: 15 }} strokeWidth={2} /> ボード</>
            )}
          </button>
        )}

        {/* Leave button */}
        <button
          onClick={handleLeave}
          style={{
            padding: '8px 20px', borderRadius: 10, border: 'none',
            background: '#ef4444', color: 'white', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', boxShadow: '0 4px 12px rgba(239,68,68,0.4)',
          }}
        >
          退出
        </button>
      </div>
    </div>
  );
}
