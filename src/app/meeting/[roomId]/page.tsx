'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export default function MeetingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const nameFromUrl = searchParams.get('name') || '';
  const pwFromUrl = searchParams.get('pw') || '';
  const uidFromUrl = searchParams.get('uid') || '';

  const [userName, setUserName] = useState(nameFromUrl);
  const [password, setPassword] = useState('');
  const [joined, setJoined] = useState(false);
  const [left, setLeft] = useState(false);
  const [error, setError] = useState('');
  const [roomValid, setRoomValid] = useState<boolean | null>(null); // null = checking

  // If name is provided in URL, auto-join (coming from the app — room created by this user)
  const autoJoin = !!nameFromUrl;

  const containerRef = useRef<HTMLDivElement>(null);
  const jitsiRef = useRef<any>(null);
  const leftNotifiedRef = useRef(false);

  // Notify backend that user left the meeting (HTTP fallback for BroadcastChannel)
  const notifyLeave = () => {
    if (leftNotifiedRef.current) return;
    leftNotifiedRef.current = true;
    const decodedRoomId = decodeURIComponent(roomId);
    const floorSlug = decodedRoomId.split('-')[0] || '';
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
            toolbarButtons: [
              'microphone', 'camera', 'desktop', 'chat',
              'raisehand', 'tileview',
            ],
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
            // Hide "End meeting for all" - only show "Leave meeting"
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

        // Set password if provided (from URL or gate screen input)
        const meetingPassword = pwFromUrl || password;
        if (meetingPassword) {
          jitsiRef.current.addListener('videoConferenceJoined', () => {
            jitsiRef.current.executeCommand('password', meetingPassword);
          });
        }

        // Intercept hangup button click — leave directly without "End meeting for all" dialog
        jitsiRef.current.addListener('toolbarButtonClicked', (key: string) => {
          if (key === 'hangup') {
            jitsiRef.current.executeCommand('hangup');
          }
        });

        jitsiRef.current.addListener('readyToClose', () => {
          notifyLeave();
          window.close();
          setLeft(true);
        });
      } catch (err) {
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

    // Notify floor page on tab close
    const handleBeforeUnload = () => {
      notifyLeave();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (jitsiRef.current) {
        jitsiRef.current.dispose();
        jitsiRef.current = null;
      }
    };
  }, [joined, roomId, userName, pwFromUrl]);

  // Validate room exists (active or permanent) before allowing join
  useEffect(() => {
    if (autoJoin) {
      // Room was just created by this user via the app — skip validation
      setRoomValid(true);
      return;
    }
    // Extract floor slug from roomId (format: {slug}-{name}-{timestamp})
    const slugPart = roomId.split('-')[0] || '';
    fetch(`/api/meetings/${encodeURIComponent(roomId)}/check?floor=${encodeURIComponent(slugPart)}`)
      .then(r => r.json())
      .then(data => setRoomValid(!!data.exists))
      .catch(() => setRoomValid(false));
  }, [roomId, autoJoin]);

  // Auto-join if name is in URL (coming from the app)
  useEffect(() => {
    if (autoJoin && userName && roomValid) {
      setJoined(true);
    }
  }, [autoJoin, userName, roomValid]);

  if (error) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a2e', color: '#e2e8f0', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 16 }}>{error}</p>
          <button onClick={() => window.close()} style={{ marginTop: 16, padding: '8px 20px', borderRadius: 8, border: 'none', background: '#0ea5e9', color: 'white', fontSize: 14, cursor: 'pointer' }}>
            閉じる
          </button>
        </div>
      </div>
    );
  }

  // Room validation: checking or not found
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
          <button onClick={() => { window.close(); window.history.back(); }} style={{
            width: '100%', padding: '10px 0', borderRadius: 8, border: 'none',
            background: '#0ea5e9', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
            戻る
          </button>
        </div>
      </div>
    );
  }

  // Left screen: show after leaving a meeting
  if (left) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', fontFamily: 'sans-serif' }}>
        <div style={{ background: 'white', borderRadius: 16, padding: 32, width: 340, boxShadow: '0 8px 32px rgba(0,0,0,0.3)', textAlign: 'center' }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: '0 0 8px' }}>ミーティングを退出しました</p>
          <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 20px' }}>タブを閉じるか、再入室できます</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => { leftNotifiedRef.current = false; setLeft(false); setJoined(true); }}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid #e2e8f0',
                background: 'white', color: '#0f172a', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              再入室
            </button>
            <button
              onClick={() => { window.close(); window.history.back(); }}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
                background: '#0ea5e9', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Gate screen: name input required for external users
  if (!joined) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', fontFamily: 'sans-serif' }}>
        <div style={{ background: 'white', borderRadius: 16, padding: 32, width: 340, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 4px', textAlign: 'center' }}>ミーティングに参加</h2>
          <p style={{ fontSize: 12, color: '#64748b', textAlign: 'center', margin: '0 0 20px' }}>名前を入力してください</p>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#475569', marginBottom: 4 }}>表示名 *</label>
            <input
              type="text"
              value={userName}
              onChange={e => setUserName(e.target.value)}
              placeholder="名前を入力"
              autoFocus
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                border: '1px solid #e2e8f0', fontSize: 14, outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {pwFromUrl && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#475569', marginBottom: 4 }}>パスワード</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="パスワードを入力"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8,
                  border: '1px solid #e2e8f0', fontSize: 14, outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          <button
            onClick={() => {
              if (!userName.trim()) return;
              setJoined(true);
            }}
            disabled={!userName.trim()}
            style={{
              width: '100%', padding: '10px 0', borderRadius: 8, border: 'none',
              background: userName.trim() ? '#0ea5e9' : '#cbd5e1',
              color: 'white', fontSize: 14, fontWeight: 600,
              cursor: userName.trim() ? 'pointer' : 'default',
            }}
          >
            参加する
          </button>
        </div>
      </div>
    );
  }

  const handleLeave = () => {
    notifyLeave();
    if (jitsiRef.current) {
      jitsiRef.current.dispose();
      jitsiRef.current = null;
    }
    window.close();
    setLeft(true);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a2e', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {/* Custom leave button */}
      <button
        onClick={handleLeave}
        style={{
          position: 'fixed', bottom: 16, right: 16, zIndex: 100,
          padding: '8px 20px', borderRadius: 10, border: 'none',
          background: '#ef4444', color: 'white', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', boxShadow: '0 4px 12px rgba(239,68,68,0.4)',
        }}
      >
        退出
      </button>
    </div>
  );
}
