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

  const [userName, setUserName] = useState(nameFromUrl);
  const [password, setPassword] = useState('');
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');

  // If name is provided in URL, auto-join (coming from the app)
  const autoJoin = !!nameFromUrl;

  const containerRef = useRef<HTMLDivElement>(null);
  const jitsiRef = useRef<any>(null);

  useEffect(() => {
    if (!joined || !roomId) return;

    const initJitsi = () => {
      if (!containerRef.current || jitsiRef.current) return;

      try {
        jitsiRef.current = new window.JitsiMeetExternalAPI('localhost:8443', {
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
              'raisehand', 'tileview', 'hangup',
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

        // Set password if provided
        if (pwFromUrl) {
          jitsiRef.current.addListener('videoConferenceJoined', () => {
            jitsiRef.current.executeCommand('password', pwFromUrl);
          });
        }

        jitsiRef.current.addListener('readyToClose', () => {
          window.close();
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

    return () => {
      if (jitsiRef.current) {
        jitsiRef.current.dispose();
        jitsiRef.current = null;
      }
    };
  }, [joined, roomId, userName, pwFromUrl]);

  // Auto-join if name is in URL (coming from the app)
  useEffect(() => {
    if (autoJoin && userName) {
      setJoined(true);
    }
  }, [autoJoin, userName]);

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

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a2e' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
