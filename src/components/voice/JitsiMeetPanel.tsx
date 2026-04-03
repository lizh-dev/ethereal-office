'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useOfficeStore } from '@/store/officeStore';

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

interface JitsiMeetPanelProps {
  roomName: string;
  userName: string;
  onClose: () => void;
}

export default function JitsiMeetPanel({ roomName, userName, onClose }: JitsiMeetPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const jitsiRef = useRef<any>(null);
  const scriptLoadedRef = useRef(false);

  const initJitsi = useCallback(() => {
    if (!containerRef.current || jitsiRef.current) return;

    const jitsiDomain = 'localhost:8443';

    try {
      jitsiRef.current = new window.JitsiMeetExternalAPI(jitsiDomain, {
        roomName,
        parentNode: containerRef.current,
        width: '100%',
        height: '100%',
        lang: 'ja',
        userInfo: {
          displayName: userName,
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: true,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          defaultLanguage: 'ja',
          toolbarButtons: [
            'microphone', 'camera', 'desktop', 'chat',
            'raisehand', 'tileview', 'hangup',
          ],
          hideConferenceSubject: true,
          hideConferenceTimer: false,
          notifications: [],
          disableThirdPartyRequests: true,
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
        },
      });

      jitsiRef.current.addListener('readyToClose', () => {
        onClose();
      });

      jitsiRef.current.addListener('videoConferenceLeft', () => {
        onClose();
      });

      jitsiRef.current.addListener('participantJoined', (p: any) => {
        useOfficeStore.getState().addActivity('meeting', `${p.displayName || 'ゲスト'} がミーティングに参加`);
      });

      jitsiRef.current.addListener('participantLeft', (p: any) => {
        useOfficeStore.getState().addActivity('meeting', `参加者がミーティングから退出`);
      });
    } catch (err) {
      console.error('Failed to init Jitsi:', err);
    }
  }, [roomName, userName, onClose]);

  useEffect(() => {
    if (window.JitsiMeetExternalAPI) {
      initJitsi();
    } else if (!scriptLoadedRef.current) {
      scriptLoadedRef.current = true;
      const script = document.createElement('script');
      script.src = '/jitsi/external_api.js';
      script.async = true;
      script.onload = initJitsi;
      script.onerror = () => {
        console.error('Failed to load Jitsi external API');
        scriptLoadedRef.current = false;
      };
      document.head.appendChild(script);
    }

    return () => {
      if (jitsiRef.current) {
        jitsiRef.current.dispose();
        jitsiRef.current = null;
      }
    };
  }, [initJitsi]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 80,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: '90vw', maxWidth: 960, height: '80vh',
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        display: 'flex', flexDirection: 'column',
        background: '#1a1a2e',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '10px 16px', background: '#16213e', borderBottom: '1px solid #0f3460',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14 }}>&#x1F3A5;</span>
            <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>{roomName}</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#ef4444', border: 'none', borderRadius: 6,
              color: 'white', fontSize: 12, fontWeight: 600,
              padding: '4px 12px', cursor: 'pointer',
            }}
          >
            退出
          </button>
        </div>

        {/* Jitsi Container */}
        <div ref={containerRef} style={{ flex: 1 }} />
      </div>
    </div>
  );
}
