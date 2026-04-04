'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { PenTool, Video, X } from 'lucide-react';
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

function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as unknown as T;
}

// ---------- Inline Board Component ----------
function MeetingBoard({ roomId, floorSlug, userName }: { roomId: string; floorSlug: string; userName: string }) {
  const [api, setApi] = useState<any>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<HocuspocusProvider | null>(null);
  const isRemoteRef = useRef(false);

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
    });
    providerRef.current = provider;

    provider.awareness?.setLocalStateField('user', {
      name: userName,
      color: '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0'),
    });

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

  const handleChange = useCallback((elements: readonly any[]) => {
    if (isRemoteRef.current) return;
    syncToYjs([...elements]);
  }, [syncToYjs]);

  return (
    <Excalidraw
      excalidrawAPI={(excalidrawApi: any) => setApi(excalidrawApi)}
      onChange={handleChange}
      isCollaborating={true}
      langCode="ja-JP"
      initialData={{ elements: [], appState: { viewBackgroundColor: '#ffffff' } }}
      UIOptions={{
        canvasActions: { loadScene: false, export: false, saveAsImage: false },
      }}
    />
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
  const [canInlineBoard, setCanInlineBoard] = useState(false);

  const autoJoin = !!nameFromUrl;
  const containerRef = useRef<HTMLDivElement>(null);
  const jitsiRef = useRef<any>(null);
  const leftNotifiedRef = useRef(false);

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
            p2p: { enabled: false },
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

  useEffect(() => {
    if (autoJoin && userName && roomValid) setJoined(true);
  }, [autoJoin, userName, roomValid]);

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
      {/* Jitsi container — hidden when board is shown (audio continues) */}
      <div ref={containerRef} style={{ width: '100%', height: '100%', display: showBoard ? 'none' : 'block' }} />

      {/* Excalidraw board — shown when toggled */}
      {showBoard && (
        <div style={{ width: '100%', height: '100%', background: 'white', position: 'absolute', inset: 0, zIndex: 50 }}>
          <style>{`
            .layer-ui__wrapper__top-right { display: none !important; }
            .main-menu-trigger { display: none !important; }
          `}</style>
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <div style={{ position: 'absolute', inset: 0 }}>
              <MeetingBoard roomId={decodedRoomId} floorSlug={floorSlug} userName={userName} />
            </div>
          </div>
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
            onClick={() => setShowBoard(v => !v)}
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
