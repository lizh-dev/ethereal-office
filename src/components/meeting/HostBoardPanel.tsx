'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { PenTool, User, Users, Eye, ChevronRight } from 'lucide-react';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';

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

// Lightweight thumbnail renderer: connects to each participant's Yjs doc and generates SVG preview
function useBoardThumbnails(meetingId: string, floorSlug: string, userId: string, participantIds: string[]) {
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const connectionsRef = useRef<Map<string, { provider: HocuspocusProvider; doc: Y.Doc }>>(new Map());
  const exportToSvgRef = useRef<any>(null);

  // Lazy-load exportToSvg
  useEffect(() => {
    import('@excalidraw/excalidraw').then(mod => {
      exportToSvgRef.current = mod.exportToSvg;
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const hocuspocusUrl = process.env.NEXT_PUBLIC_HOCUSPOCUS_URL || `ws://${window.location.hostname}:3002`;
    const currentIds = new Set(participantIds);
    const conns = connectionsRef.current;

    // Remove connections for participants that left
    for (const [pid, conn] of conns) {
      if (!currentIds.has(pid)) {
        conn.provider.destroy();
        conn.doc.destroy();
        conns.delete(pid);
      }
    }

    // Add connections for new participants
    for (const pid of participantIds) {
      if (pid === userId) continue; // skip self
      if (conns.has(pid)) continue;

      const doc = new Y.Doc();
      const boardDocName = `board-${meetingId}-${pid}`;
      const provider = new HocuspocusProvider({
        url: hocuspocusUrl,
        name: boardDocName,
        document: doc,
        token: JSON.stringify({ floor: floorSlug, boardId: `${floorSlug}-${meetingId}-${pid}`, userId }),
      });
      conns.set(pid, { provider, doc });
    }

    // Periodic thumbnail generation
    const generateThumbnails = async () => {
      const exportFn = exportToSvgRef.current;
      if (!exportFn) return;

      const newThumbnails: Record<string, string> = {};
      for (const [pid, conn] of conns) {
        try {
          const yScene = conn.doc.getMap('scene');
          const elements = yScene.get('elements');
          if (!elements || !Array.isArray(elements) || elements.length === 0) {
            newThumbnails[pid] = '';
            continue;
          }
          const svg = await exportFn({
            elements,
            appState: { viewBackgroundColor: '#ffffff', exportWithDarkMode: false },
            files: null,
            exportPadding: 10,
          });
          // Serialize SVG to data URL
          const svgStr = new XMLSerializer().serializeToString(svg);
          newThumbnails[pid] = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgStr)))}`;
        } catch {
          newThumbnails[pid] = '';
        }
      }
      setThumbnails(prev => {
        // Only update if changed
        const changed = Object.keys(newThumbnails).some(k => prev[k] !== newThumbnails[k]);
        return changed ? { ...prev, ...newThumbnails } : prev;
      });
    };

    // Initial + periodic
    const timer = setTimeout(generateThumbnails, 1500);
    const interval = setInterval(generateThumbnails, 5000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [meetingId, floorSlug, userId, participantIds.join(',')]);

  // Cleanup all on unmount
  useEffect(() => {
    return () => {
      const conns = connectionsRef.current;
      for (const [, conn] of conns) {
        conn.provider.destroy();
        conn.doc.destroy();
      }
      conns.clear();
    };
  }, []);

  return thumbnails;
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
  const participantIds = otherParticipants.map(p => p.id);
  const thumbnails = useBoardThumbnails(meetingId, floorSlug, userId, participantIds);

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

      {/* Participant list with thumbnails */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }}>
        {otherParticipants.map(p => {
          const isSelected = selectedParticipantId === p.id;
          const thumb = thumbnails[p.id];
          return (
            <button
              key={p.id}
              onClick={() => onSelectParticipant(p.id)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: 8,
                border: isSelected ? '2px solid #0ea5e9' : '2px solid transparent',
                background: isSelected ? '#1e3a5f' : '#334155',
                color: 'white',
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                marginBottom: 8,
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => {
                if (!isSelected) {
                  (e.currentTarget as HTMLElement).style.background = '#475569';
                }
              }}
              onMouseLeave={e => {
                if (!isSelected) {
                  (e.currentTarget as HTMLElement).style.background = '#334155';
                }
              }}
            >
              {/* Thumbnail */}
              <div
                style={{
                  width: '100%',
                  height: 100,
                  borderRadius: 6,
                  background: '#f8fafc',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {thumb ? (
                  <img
                    src={thumb}
                    alt={`${p.name}のボード`}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>未記入</span>
                )}
              </div>
              {/* Name bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <User style={{ width: 12, height: 12, color: '#94a3b8' }} strokeWidth={1.8} />
                  <span style={{ fontWeight: 500, fontSize: 11 }}>{p.name}</span>
                </div>
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
