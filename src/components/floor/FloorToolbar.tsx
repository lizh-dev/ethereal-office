'use client';

import { useState } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import dynamic from 'next/dynamic';
import JitsiMeetPanel from '@/components/voice/JitsiMeetPanel';

const MeetingBoard = dynamic(() => import('@/components/voice/MeetingBoard'), { ssr: false });

/**
 * Floating toolbar on the floor view.
 * Provides quick access to: Meeting (Jitsi), Whiteboard, Activity feed.
 * Only visible on floor view when not in editor mode.
 */
export default function FloorToolbar() {
  const currentUser = useOfficeStore(s => s.currentUser);
  const canVoiceCall = useOfficeStore(s => s.planPermissions.voiceCall);
  const canMeetingBoard = useOfficeStore(s => s.planPermissions.meetingBoard);

  const [showMeeting, setShowMeeting] = useState(false);
  const [meetingName, setMeetingName] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [showBoard, setShowBoard] = useState(false);

  const floorSlug = typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : '';

  const handleStartMeeting = () => {
    const name = meetingName.trim() || 'ミーティング';
    const id = `${floorSlug}-${name.replace(/\s+/g, '-')}-${Date.now()}`;
    setActiveMeetingId(id);
    setShowMeeting(true);
    setShowCreateDialog(false);
    setMeetingName('');
    useOfficeStore.getState().addActivity('meeting', `${currentUser.name} がミーティング「${name}」を開始`);
  };

  const handleLeaveMeeting = () => {
    setActiveMeetingId(null);
    setShowMeeting(false);
  };

  return (
    <>
      {/* Toolbar buttons — top right, below TopBar */}
      <div style={{
        position: 'fixed', top: 60, right: 12, zIndex: 50,
        display: 'flex', gap: 6,
      }}>
        {/* Meeting button */}
        {canVoiceCall && (
          <button
            onClick={() => {
              if (activeMeetingId) {
                setShowMeeting(v => !v);
              } else {
                setShowCreateDialog(v => !v);
              }
            }}
            style={{
              width: 36, height: 36, borderRadius: 10,
              border: activeMeetingId ? '1px solid #86efac' : '1px solid #e2e8f0',
              background: activeMeetingId ? '#f0fdf4' : 'white',
              color: activeMeetingId ? '#16a34a' : '#64748b',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 15, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              transition: 'all 0.15s',
            }}
            title={activeMeetingId ? 'ミーティング表示/非表示' : 'ミーティングを開始'}
          >
            🎥
          </button>
        )}

        {/* Whiteboard button */}
        {canMeetingBoard && (
          <button
            onClick={() => setShowBoard(v => !v)}
            style={{
              width: 36, height: 36, borderRadius: 10,
              border: showBoard ? '1px solid #a5b4fc' : '1px solid #e2e8f0',
              background: showBoard ? '#eef2ff' : 'white',
              color: showBoard ? '#4f46e5' : '#64748b',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 15, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              transition: 'all 0.15s',
            }}
            title="ホワイトボード"
          >
            📝
          </button>
        )}
      </div>

      {/* Quick meeting create popover */}
      {showCreateDialog && !activeMeetingId && (
        <div style={{
          position: 'fixed', top: 100, right: 12, zIndex: 51,
          background: 'white', borderRadius: 12, padding: 16,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0',
          width: 260,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 10 }}>
            ミーティングを開始
          </div>
          <input
            type="text"
            value={meetingName}
            onChange={e => setMeetingName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleStartMeeting()}
            placeholder="ミーティング名（任意）"
            autoFocus
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 8,
              border: '1px solid #e2e8f0', fontSize: 13, outline: 'none',
              marginBottom: 10, boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleStartMeeting} style={{
              flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
              background: '#0ea5e9', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>
              開始
            </button>
            <button onClick={() => setShowCreateDialog(false)} style={{
              padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0',
              background: 'white', color: '#64748b', fontSize: 12, cursor: 'pointer',
            }}>
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Jitsi Meeting Panel */}
      {activeMeetingId && showMeeting && (
        <JitsiMeetPanel
          roomName={activeMeetingId}
          userName={currentUser.name}
          onClose={handleLeaveMeeting}
        />
      )}

      {/* Standalone Whiteboard */}
      {showBoard && (
        <MeetingBoard
          meetingId={`${floorSlug}-board`}
          onClose={() => setShowBoard(false)}
        />
      )}
    </>
  );
}
