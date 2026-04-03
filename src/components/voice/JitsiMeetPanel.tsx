'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
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
  const [size, setSize] = useState<'normal' | 'large'>('normal');
  const [pos, setPos] = useState({ x: typeof window !== 'undefined' ? window.innerWidth - 420 : 400, y: 80 });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    const handleMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 200, dragRef.current.origX + ev.clientX - dragRef.current.startX)),
        y: Math.max(0, Math.min(window.innerHeight - 100, dragRef.current.origY + ev.clientY - dragRef.current.startY)),
      });
    };
    const handleUp = () => {
      dragRef.current = null;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [pos]);

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
        userInfo: { displayName: userName },
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

      jitsiRef.current.addListener('readyToClose', () => onClose());
      jitsiRef.current.addListener('videoConferenceLeft', () => onClose());
      jitsiRef.current.addListener('participantJoined', (p: any) => {
        useOfficeStore.getState().addActivity('meeting', `${p.displayName || 'ゲスト'} がミーティングに参加`);
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

  const w = size === 'large' ? 800 : 400;
  const h = size === 'large' ? 560 : 340;

  return (
    <div style={{
      position: 'fixed', left: pos.x, top: pos.y,
      width: w, height: h, zIndex: 80,
      borderRadius: 14, overflow: 'hidden',
      boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
      display: 'flex', flexDirection: 'column',
      background: '#1a1a2e',
      transition: 'width 0.2s, height 0.2s',
    }}>
      {/* Header — draggable */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '6px 12px', background: '#16213e', borderBottom: '1px solid #0f3460',
          cursor: 'grab', userSelect: 'none', flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13 }}>🎥</span>
          <span style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 600 }}>ミーティング</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setSize(s => s === 'large' ? 'normal' : 'large')}
            style={{
              background: 'transparent', border: 'none', color: '#94a3b8',
              cursor: 'pointer', fontSize: 12, padding: '2px 4px',
            }}
            title={size === 'large' ? '縮小' : '拡大'}
          >
            {size === 'large' ? '⊟' : '⊞'}
          </button>
          <button
            onClick={onClose}
            style={{
              background: '#ef4444', border: 'none', borderRadius: 6,
              color: 'white', fontSize: 10, fontWeight: 600,
              padding: '2px 10px', cursor: 'pointer',
            }}
          >
            退出
          </button>
        </div>
      </div>

      {/* Jitsi Container */}
      <div ref={containerRef} style={{ flex: 1 }} />
    </div>
  );
}
