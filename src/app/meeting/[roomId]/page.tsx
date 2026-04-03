'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export default function MeetingPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const containerRef = useRef<HTMLDivElement>(null);
  const jitsiRef = useRef<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!roomId) return;

    // Get userName from URL hash (client-side only)
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const userName = hashParams.get('name') || 'ゲスト';

    const initJitsi = () => {
      if (!containerRef.current || jitsiRef.current) return;

      try {
        jitsiRef.current = new window.JitsiMeetExternalAPI('localhost:8880', {
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
              'raisehand', 'tileview', 'hangup', 'participants-pane',
            ],
            hideConferenceSubject: true,
            notifications: [],
            disableThirdPartyRequests: true,
            p2p: { enabled: false },
            enableWelcomePage: false,
            enableClosePage: false,
            feedbackPercentage: 0,
            channelLastN: -1,
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

        jitsiRef.current.addListener('readyToClose', () => {
          window.close();
        });
      } catch (err) {
        setError('ミーティングの接続に失敗しました。');
        console.error('Jitsi init failed:', err);
      }
    };

    // Load Jitsi external API script
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
  }, [roomId]);

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

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a2e' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
