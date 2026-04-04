'use client';

import { useEffect, useState, useCallback } from 'react';
import { PenTool, User, Users, Eye, ChevronRight } from 'lucide-react';

interface HostBoardPanelProps {
  meetingId: string;
  floorSlug: string;
  userId: string;
  userName: string;
  selectedParticipantId: string | null;
  onSelectParticipant: (participantId: string | null) => void;
  isRedPen: boolean;
  onToggleRedPen: () => void;
}

export default function HostBoardPanel({
  meetingId,
  floorSlug,
  userId,
  userName,
  selectedParticipantId,
  onSelectParticipant,
  isRedPen,
  onToggleRedPen,
}: HostBoardPanelProps) {
  const [participants, setParticipants] = useState<{ id: string; name: string }[]>([]);

  const fetchInfo = useCallback(() => {
    fetch(
      `/api/meetings/${encodeURIComponent(meetingId)}/info?floor=${encodeURIComponent(floorSlug)}&userId=${encodeURIComponent(userId)}`
    )
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data?.participants) setParticipants(data.participants);
      })
      .catch(() => {});
  }, [meetingId, floorSlug, userId]);

  useEffect(() => {
    fetchInfo();
    const interval = setInterval(fetchInfo, 10000);
    return () => clearInterval(interval);
  }, [fetchInfo]);

  const otherParticipants = participants.filter(p => p.id !== userId);

  return (
    <div
      style={{
        width: 260,
        background: '#1e293b',
        borderRight: '1px solid #334155',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #334155' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users style={{ width: 14, height: 14, color: '#94a3b8' }} strokeWidth={1.8} />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>
              参加者ボード
            </span>
          </div>
          <span
            style={{
              fontSize: 11,
              color: '#94a3b8',
              background: '#334155',
              padding: '2px 8px',
              borderRadius: 10,
            }}
          >
            {participants.length}人
          </span>
        </div>
      </div>

      {/* My Board button */}
      <div style={{ padding: '8px 12px' }}>
        <button
          onClick={() => onSelectParticipant(null)}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 8,
            border: 'none',
            background: selectedParticipantId === null ? '#0ea5e9' : '#334155',
            color: 'white',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'background 0.15s',
          }}
        >
          <PenTool style={{ width: 13, height: 13 }} strokeWidth={1.8} />
          マイボード
        </button>
      </div>

      {/* Red Pen toggle - only when viewing another participant's board */}
      {selectedParticipantId && selectedParticipantId !== userId && (
        <div style={{ padding: '0 12px 8px' }}>
          <button
            onClick={onToggleRedPen}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 8,
              border: 'none',
              background: isRedPen ? '#ef4444' : '#334155',
              color: 'white',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'background 0.15s',
            }}
          >
            <PenTool style={{ width: 13, height: 13 }} strokeWidth={1.8} />
            {isRedPen ? '赤ペン ON' : '赤ペン OFF'}
          </button>
        </div>
      )}

      {/* Participant list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }}>
        {otherParticipants.map(p => {
          const isSelected = selectedParticipantId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onSelectParticipant(p.id)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: 'none',
                background: isSelected ? '#1e3a5f' : 'transparent',
                color: 'white',
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 4,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => {
                if (!isSelected) {
                  (e.currentTarget as HTMLElement).style.background = '#334155';
                }
              }}
              onMouseLeave={e => {
                if (!isSelected) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <User style={{ width: 13, height: 13, color: '#94a3b8' }} strokeWidth={1.8} />
                <span style={{ fontWeight: 500 }}>{p.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Eye style={{ width: 11, height: 11, color: '#94a3b8' }} strokeWidth={1.8} />
                <ChevronRight style={{ width: 11, height: 11, color: '#94a3b8' }} strokeWidth={1.8} />
              </div>
            </button>
          );
        })}
        {otherParticipants.length === 0 && (
          <p
            style={{
              fontSize: 11,
              color: '#64748b',
              textAlign: 'center',
              padding: '20px 0',
            }}
          >
            他の参加者を待っています...
          </p>
        )}
      </div>
    </div>
  );
}
