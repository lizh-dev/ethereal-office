'use client';

import { useState, useEffect } from 'react';
import { useOfficeStore, ActiveMeetingState } from '@/store/officeStore';
import { useWsSend } from '@/contexts/WebSocketContext';

interface PermanentRoom {
  id: number;
  roomId: string;
  name: string;
  createdBy: string;
  creatorName: string;
  hasPassword: boolean;
  permanent: boolean;
}

interface MeetingLog {
  id: number;
  meetingId: string;
  name: string;
  creatorName: string;
  maxParticipants: number;
  startedAt: string;
  endedAt: string | null;
}

export default function MeetingRoom() {
  const currentUser = useOfficeStore((s) => s.currentUser);
  const activeMeetings = useOfficeStore((s) => s.activeMeetings);
  const myMeetingId = useOfficeStore((s) => s.myMeetingId);
  const maxParticipants = useOfficeStore((s) => s.planPermissions.maxMeetingParticipants);
  const wsSend = useWsSend();

  const [permanentRooms, setPermanentRooms] = useState<PermanentRoom[]>([]);
  const [meetingLogs, setMeetingLogs] = useState<MeetingLog[]>([]);
  const [showCreatePermanent, setShowCreatePermanent] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomPassword, setNewRoomPassword] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [joiningMeetingId, setJoiningMeetingId] = useState<string | null>(null);

  const floorSlug = typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : '';

  // Load permanent rooms and meeting logs from API
  useEffect(() => {
    if (!floorSlug) return;
    fetch(`/api/floors/${floorSlug}/meeting-rooms`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setPermanentRooms(data); })
      .catch(() => {});
    fetch(`/api/floors/${floorSlug}/meeting-logs`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setMeetingLogs(data); })
      .catch(() => {});
  }, [floorSlug]);

  const handleCreatePermanent = async () => {
    if (!newRoomName.trim()) return;
    try {
      const res = await fetch(`/api/floors/${floorSlug}/meeting-rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoomName.trim(),
          password: newRoomPassword.trim() || '',
          userId: currentUser.id,
          userName: currentUser.name,
        }),
      });
      if (res.ok) {
        const room = await res.json();
        setPermanentRooms(prev => [...prev, room]);
        setNewRoomName('');
        setNewRoomPassword('');
        setShowCreatePermanent(false);
      }
    } catch { /* ignore */ }
  };

  const handleDeletePermanent = async (roomId: string) => {
    try {
      await fetch(`/api/meeting-rooms/${roomId}`, { method: 'DELETE' });
      setPermanentRooms(prev => prev.filter(r => r.roomId !== roomId));
    } catch { /* ignore */ }
  };

  const handleJoin = (meetingId: string, password?: string) => {
    wsSend.meetingJoin(meetingId);
    useOfficeStore.getState().setMyMeetingId(meetingId);
    if (password) {
      try { localStorage.setItem(`meeting-pw-${meetingId}`, password); } catch { /* ignore */ }
    }
    const meetingUrl = `/meeting/${meetingId}?name=${encodeURIComponent(currentUser.name)}&uid=${encodeURIComponent(currentUser.id)}`;
    window.open(meetingUrl, '_blank');
    setJoiningMeetingId(null);
    setPasswordInput('');
  };

  const handleCopyLink = (meetingId: string) => {
    const url = `${window.location.origin}/meeting/${meetingId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(meetingId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isFull = (m: ActiveMeetingState) =>
    maxParticipants > 0 && m.participants >= maxParticipants;

  // Find active meeting info for a permanent room
  const getActiveInfo = (roomId: string) => activeMeetings.find(m => m.id === roomId);

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* === Active Quick Meetings === */}
      <section>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
          アクティブミーティング
        </h3>
        {activeMeetings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 12 }}>
            進行中のミーティングはありません
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {activeMeetings.map(m => {
              const isMyMeeting = myMeetingId === m.id;
              const full = isFull(m);
              return (
                <div key={m.id} style={{
                  padding: '10px 12px', borderRadius: 10,
                  background: isMyMeeting ? '#eff6ff' : 'white',
                  border: isMyMeeting ? '1px solid #93c5fd' : '1px solid #f1f5f9',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {isMyMeeting && <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />}
                      {m.hasPassword && <span title="パスワード保護">&#x1F512;</span>}
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{m.name}</span>
                    </div>
                    <span style={{ fontSize: 11, color: full ? '#ef4444' : '#64748b', fontWeight: full ? 600 : 400 }}>
                      {m.participants}{maxParticipants > 0 ? `/${maxParticipants}` : ''} 人
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>{m.creatorName}</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {!isMyMeeting && (
                      m.hasPassword && joiningMeetingId === m.id ? (
                        <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                          <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleJoin(m.id, passwordInput)}
                            placeholder="PW" autoFocus
                            style={{ flex: 1, padding: '3px 6px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 11 }} />
                          <button onClick={() => handleJoin(m.id, passwordInput)} style={{ padding: '3px 8px', borderRadius: 6, border: 'none', background: '#0ea5e9', color: 'white', fontSize: 11, cursor: 'pointer' }}>OK</button>
                        </div>
                      ) : (
                        <button onClick={() => m.hasPassword ? setJoiningMeetingId(m.id) : handleJoin(m.id)}
                          disabled={full} title={full ? '参加上限' : '参加'}
                          style={{ padding: '3px 10px', borderRadius: 6, border: 'none', background: full ? '#cbd5e1' : '#0ea5e9', color: 'white', fontSize: 11, fontWeight: 600, cursor: full ? 'not-allowed' : 'pointer' }}>
                          参加
                        </button>
                      )
                    )}
                    <button onClick={() => handleCopyLink(m.id)}
                      style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', color: copiedId === m.id ? '#22c55e' : '#475569', fontSize: 11, cursor: 'pointer' }}>
                      {copiedId === m.id ? 'OK' : 'URL'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* === Permanent Rooms === */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            常設ルーム
          </h3>
          <button onClick={() => setShowCreatePermanent(v => !v)} style={{
            padding: '4px 12px', borderRadius: 8, border: 'none',
            background: '#0ea5e9', color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}>
            + 作成
          </button>
        </div>

        {showCreatePermanent && (
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: 12, marginBottom: 10, border: '1px solid #e2e8f0' }}>
            <input type="text" value={newRoomName} onChange={e => setNewRoomName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreatePermanent()}
              placeholder="ルーム名" autoFocus
              style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12, outline: 'none', marginBottom: 6, boxSizing: 'border-box' }} />
            <input type="password" value={newRoomPassword} onChange={e => setNewRoomPassword(e.target.value)}
              placeholder="パスワード（任意）"
              style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12, outline: 'none', marginBottom: 8, boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={handleCreatePermanent} style={{
                flex: 1, padding: '5px 0', borderRadius: 6, border: 'none',
                background: '#0ea5e9', color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }}>作成</button>
              <button onClick={() => setShowCreatePermanent(false)} style={{
                padding: '5px 12px', borderRadius: 6, border: '1px solid #e2e8f0',
                background: 'white', color: '#64748b', fontSize: 11, cursor: 'pointer',
              }}>キャンセル</button>
            </div>
          </div>
        )}

        {permanentRooms.length === 0 && !showCreatePermanent ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 12 }}>
            常設ルームはありません
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {permanentRooms.map(room => {
              const active = getActiveInfo(room.roomId);
              const isMyMeeting = myMeetingId === room.roomId;
              return (
                <div key={room.roomId} style={{
                  padding: '10px 12px', borderRadius: 10,
                  background: isMyMeeting ? '#eff6ff' : 'white',
                  border: isMyMeeting ? '1px solid #93c5fd' : '1px solid #f1f5f9',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {active && <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />}
                      {room.hasPassword && <span>&#x1F512;</span>}
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{room.name}</span>
                    </div>
                    {active ? (
                      <span style={{ fontSize: 11, color: '#64748b' }}>{active.participants} 人</span>
                    ) : (
                      <span style={{ fontSize: 10, color: '#94a3b8' }}>空室</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>{room.creatorName}</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {!isMyMeeting && (
                      <button onClick={() => handleJoin(room.roomId)}
                        style={{ padding: '3px 10px', borderRadius: 6, border: 'none', background: '#0ea5e9', color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                        入室
                      </button>
                    )}
                    <button onClick={() => handleCopyLink(room.roomId)}
                      style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', color: copiedId === room.roomId ? '#22c55e' : '#475569', fontSize: 11, cursor: 'pointer' }}>
                      {copiedId === room.roomId ? 'OK' : 'URL'}
                    </button>
                    {room.createdBy === currentUser.id && (
                      <button onClick={() => handleDeletePermanent(room.roomId)}
                        style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid #fecaca', background: 'white', color: '#ef4444', fontSize: 11, cursor: 'pointer' }}>
                        削除
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* === Meeting History === */}
      {meetingLogs.length > 0 && (
        <section>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 10px' }}>
            履歴
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {meetingLogs.filter(l => l.endedAt).map(log => {
              const start = new Date(log.startedAt);
              const end = log.endedAt ? new Date(log.endedAt) : null;
              const durationMin = end ? Math.round((end.getTime() - start.getTime()) / 60000) : 0;
              const dateStr = `${start.getMonth() + 1}/${start.getDate()} ${start.getHours()}:${start.getMinutes().toString().padStart(2, '0')}`;
              return (
                <div key={log.id} style={{
                  padding: '8px 12px', borderRadius: 8,
                  background: '#f8fafc', border: '1px solid #f1f5f9',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{log.name}</span>
                    <span style={{ fontSize: 10, color: '#94a3b8' }}>{dateStr}</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                    {log.creatorName} | {durationMin}分 | 最大{log.maxParticipants}人
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
