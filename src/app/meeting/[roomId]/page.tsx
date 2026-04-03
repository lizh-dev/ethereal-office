'use client';

import { useEffect, useRef, use } from 'react';

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export default function MeetingPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const containerRef = useRef<HTMLDivElement>(null);
  const jitsiRef = useRef<any>(null);

  // Get userName from URL hash
  const userName = typeof window !== 'undefined'
    ? decodeURIComponent(new URLSearchParams(window.location.hash.slice(1)).get('name') || 'ゲスト')
    : 'ゲスト';

  useEffect(() => {
    const initJitsi = () => {
      if (!containerRef.current || jitsiRef.current) return;

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
          hideConferenceTimer: false,
          notifications: [],
          disableThirdPartyRequests: true,
          p2p: { enabled: false },
          enableWelcomePage: false,
          enableClosePage: false,
          feedbackPercentage: 0,
          // Prevent auto-disconnect when alone
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
    };

    // Load Jitsi external API script
    if (window.JitsiMeetExternalAPI) {
      initJitsi();
    } else {
      const script = document.createElement('script');
      script.src = '/jitsi/external_api.js';
      script.async = true;
      script.onload = initJitsi;
      document.head.appendChild(script);
    }

    return () => {
      if (jitsiRef.current) {
        jitsiRef.current.dispose();
        jitsiRef.current = null;
      }
    };
  }, [roomId, userName]);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a2e' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
