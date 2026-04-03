'use client';

import { useState } from 'react';
import { useOfficeStore, ActiveMeetingState } from '@/store/officeStore';
import { useWsSend } from '@/contexts/WebSocketContext';

export default function MeetingRoom() {
  const currentUser = useOfficeStore((s) => s.currentUser);
  const activeMeetings = useOfficeStore((s) => s.activeMeetings);
  const myMeetingId = useOfficeStore((s) => s.myMeetingId);
  const maxParticipants = useOfficeStore((s) => s.planPermissions.maxMeetingParticipants);
  const wsSend = useWsSend();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [joiningMeetingId, setJoiningMeetingId] = useState<string | null>(null);

  const handleJoin = (meeting: ActiveMeetingState, password?: string) => {
    wsSend.meetingJoin(meeting.id);
    useOfficeStore.getState().setMyMeetingId(meeting.id);
    const meetingUrl = `/meeting/${meeting.id}?name=${encodeURIComponent(currentUser.name)}${password ? `&pw=${encodeURIComponent(password)}` : ''}`;
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

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>
        ミーティングルーム
      </h3>

      {activeMeetings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 13 }}>
          アクティブなミーティングはありません
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {activeMeetings.map(m => {
            const isMyMeeting = myMeetingId === m.id;
            const full = isFull(m);
            return (
              <div key={m.id} style={{
                padding: '10px 14px', borderRadius: 10,
                background: isMyMeeting ? '#eff6ff' : 'white',
                border: isMyMeeting ? '1px solid #93c5fd' : '1px solid #f1f5f9',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isMyMeeting && (
                      <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                    )}
                    {m.hasPassword && <span title="パスワード保護">&#x1F512;</span>}
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{m.name}</span>
                  </div>
                  <span style={{ fontSize: 11, color: full ? '#ef4444' : '#64748b', fontWeight: full ? 600 : 400 }}>
                    {m.participants}{maxParticipants > 0 ? `/${maxParticipants}` : ''}人
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>
                  作成: {m.creatorName}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {!isMyMeeting && (
                    <>
                      {m.hasPassword && joiningMeetingId === m.id ? (
                        <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                          <input
                            type="password"
                            value={passwordInput}
                            onChange={e => setPasswordInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleJoin(m, passwordInput)}
                            placeholder="パスワード"
                            style={{
                              flex: 1, padding: '4px 8px', borderRadius: 6,
                              border: '1px solid #e2e8f0', fontSize: 11, outline: 'none',
                            }}
                            autoFocus
                          />
                          <button onClick={() => handleJoin(m, passwordInput)} style={{
                            padding: '4px 10px', borderRadius: 6, border: 'none',
                            background: '#0ea5e9', color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                          }}>OK</button>
                          <button onClick={() => { setJoiningMeetingId(null); setPasswordInput(''); }} style={{
                            padding: '4px 6px', borderRadius: 6, border: '1px solid #e2e8f0',
                            background: 'white', color: '#64748b', fontSize: 11, cursor: 'pointer',
                          }}>✕</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            if (m.hasPassword) {
                              setJoiningMeetingId(m.id);
                            } else {
                              handleJoin(m);
                            }
                          }}
                          disabled={full}
                          title={full ? '参加上限に達しています' : '参加'}
                          style={{
                            padding: '4px 10px', borderRadius: 6, border: 'none',
                            background: full ? '#cbd5e1' : '#0ea5e9',
                            color: 'white', fontSize: 11, fontWeight: 600,
                            cursor: full ? 'not-allowed' : 'pointer',
                          }}
                        >
                          参加
                        </button>
                      )}
                    </>
                  )}
                  <button
                    onClick={() => handleCopyLink(m.id)}
                    style={{
                      padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0',
                      background: 'white', color: copiedId === m.id ? '#22c55e' : '#475569',
                      fontSize: 11, cursor: 'pointer',
                    }}
                  >
                    {copiedId === m.id ? 'コピー済み' : 'リンクをコピー'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
