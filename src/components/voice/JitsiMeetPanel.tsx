'use client';

import { useState, useEffect } from 'react';

interface JitsiMeetPanelProps {
  roomName: string;
  userName: string;
  onClose: () => void;
}

export default function JitsiMeetPanel({ roomName, userName, onClose }: JitsiMeetPanelProps) {
  const [jitsiUrl, setJitsiUrl] = useState('');

  useEffect(() => {
    fetch('/api/jitsi/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room: roomName, userName }),
    })
      .then(r => r.json())
      .then(data => setJitsiUrl(data.url || ''))
      .catch(() => setJitsiUrl(`https://localhost:8443/${roomName}`));
  }, [roomName, userName]);

  return (
    <div style={{
      position: 'fixed', right: 16, top: 64, zIndex: 80,
      background: 'white', borderRadius: 12, padding: 16,
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0',
      width: 280,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>ミーティング中</span>
      </div>
      <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px' }}>
        別タブでビデオ会議が開いています。
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        {jitsiUrl && (
          <a
            href={jitsiUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
              background: '#0ea5e9', color: 'white', fontSize: 12, fontWeight: 600,
              textAlign: 'center', textDecoration: 'none', display: 'block',
            }}
          >
            会議を開く
          </a>
        )}
        <button
          onClick={onClose}
          style={{
            padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0',
            background: 'white', color: '#ef4444', fontSize: 12, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          終了
        </button>
      </div>
    </div>
  );
}
