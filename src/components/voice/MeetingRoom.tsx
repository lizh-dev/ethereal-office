'use client';

import { useState } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import { useWsSend } from '@/contexts/WebSocketContext';
import JitsiMeetPanel from './JitsiMeetPanel';
import MeetingBoard from './MeetingBoard';
interface Meeting {
  id: string;
  name: string;
  createdBy: string;
  participants: number;
}

export default function MeetingRoom() {
  const currentUser = useOfficeStore((s) => s.currentUser);
  const [activeMeeting, setActiveMeeting] = useState<string | null>(null);
  const [showBoard, setShowBoard] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const wsSend = useWsSend();

  const floorSlug = typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : '';

  const handleCreate = () => {
    if (!newRoomName.trim()) return;
    const meeting: Meeting = {
      id: `${floorSlug}-${newRoomName.trim().replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
      name: newRoomName.trim(),
      createdBy: currentUser.name,
      participants: 0,
    };
    setMeetings(prev => [...prev, meeting]);
    setNewRoomName('');
    setShowCreate(false);
    setActiveMeeting(meeting.id);

    useOfficeStore.getState().addActivity('meeting', `${currentUser.name} がミーティング「${meeting.name}」を開始`);
  };

  const handleJoin = (meetingId: string) => {
    setActiveMeeting(meetingId);
  };

  const handleLeave = () => {
    setActiveMeeting(null);
  };

  return (
      <div style={{ padding: 16 }}>
        {/* Meeting List */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            ミーティングルーム
          </h3>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              padding: '6px 14px', borderRadius: 8, border: 'none',
              background: '#0ea5e9', color: 'white', fontSize: 12,
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            + 作成
          </button>
        </div>

        {/* Create Modal */}
        {showCreate && (
          <div style={{
            background: '#f8fafc', borderRadius: 10, padding: 16, marginBottom: 16,
            border: '1px solid #e2e8f0',
          }}>
            <input
              type="text"
              value={newRoomName}
              onChange={e => setNewRoomName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="ミーティング名を入力..."
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 6,
                border: '1px solid #e2e8f0', fontSize: 13, outline: 'none',
                marginBottom: 8, boxSizing: 'border-box',
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleCreate} style={{
                flex: 1, padding: '6px 0', borderRadius: 6, border: 'none',
                background: '#0ea5e9', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>
                作成して参加
              </button>
              <button onClick={() => setShowCreate(false)} style={{
                padding: '6px 14px', borderRadius: 6, border: '1px solid #e2e8f0',
                background: 'white', color: '#64748b', fontSize: 12, cursor: 'pointer',
              }}>
                キャンセル
              </button>
            </div>
          </div>
        )}

        {/* Room List */}
        {meetings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 13 }}>
            ミーティングルームがありません
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {meetings.map(m => (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: 10,
                background: activeMeeting === m.id ? '#eff6ff' : 'white',
                border: activeMeeting === m.id ? '1px solid #93c5fd' : '1px solid #f1f5f9',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                    {activeMeeting === m.id && (
                      <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#22c55e', marginRight: 6 }} />
                    )}
                    {m.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>作成: {m.createdBy}</div>
                </div>
                {activeMeeting === m.id ? (
                  <button onClick={handleLeave} style={{
                    padding: '4px 10px', borderRadius: 6, border: 'none',
                    background: '#ef4444', color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  }}>
                    退出
                  </button>
                ) : (
                  <button onClick={() => handleJoin(m.id)} style={{
                    padding: '4px 10px', borderRadius: 6, border: 'none',
                    background: '#0ea5e9', color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  }}>
                    参加
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Active Meeting Controls */}
        {activeMeeting && (
          <>
            <div style={{
              display: 'flex', gap: 8, padding: '12px 0', justifyContent: 'center',
            }}>
              <button onClick={() => setShowBoard(true)} style={{
                padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0',
                background: 'white', color: '#0f172a', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}>
                &#x1F4DD; 共有ボード
              </button>
            </div>

            <JitsiMeetPanel
              roomName={activeMeeting}
              userName={currentUser.name}
              onClose={handleLeave}
            />

            {showBoard && (
              <MeetingBoard
                meetingId={activeMeeting}
                onClose={() => setShowBoard(false)}
              />
            )}
          </>
        )}
      </div>
  );
}
