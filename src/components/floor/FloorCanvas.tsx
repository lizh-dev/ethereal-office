'use client';

import dynamic from 'next/dynamic';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import { getAvatarUrl } from './assets';
import type { User } from '@/types';

const Editor = dynamic(() => import('./ExcalidrawEditor'), {
  ssr: false,
  loading: () => <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>読み込み中...</div>,
});

const STATUS_COLORS: Record<string, string> = {
  online: '#4CAF50', busy: '#F44336', focusing: '#FF9800', offline: '#BDBDBD',
};

const PROXIMITY_DIST = 120; // scene units
const ACTION_EMOJI: Record<string, string> = {
  working: '💻', meeting: '🤝', break: '☕', away: '💤', idle: '',
};

const ACTION_LABELS: Record<string, string> = {
  working: '作業中', meeting: '会議中', break: '休憩中', away: '離席中', idle: '',
};

const STATUS_LABELS: Record<string, string> = {
  online: 'オンライン', busy: 'ビジー', focusing: '集中モード', offline: 'オフライン',
};

// Convert Excalidraw scene coords to screen pixel coords
function sceneToScreen(sceneX: number, sceneY: number, appState: any): { x: number; y: number } {
  if (!appState) return { x: sceneX, y: sceneY };
  const zoom = appState.zoom?.value || 1;
  const scrollX = appState.scrollX || 0;
  const scrollY = appState.scrollY || 0;
  // Do NOT add offsetLeft/offsetTop — the overlay div is already positioned at the same origin as Excalidraw
  return {
    x: (sceneX + scrollX) * zoom,
    y: (sceneY + scrollY) * zoom,
  };
}

interface FloorCanvasProps {
  floorSlug?: string;
  savedScene?: unknown;
}

export default function FloorCanvas({ floorSlug, savedScene }: FloorCanvasProps = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [h, setH] = useState(600);
  const editorMode = useOfficeStore((s) => s.editorMode);
  const users = useOfficeStore((s) => s.users);
  const currentUser = useOfficeStore((s) => s.currentUser);
  const excalidrawAPI = useOfficeStore((s) => s.excalidrawAPI);
  const moveCurrentUser = useOfficeStore((s) => s.moveCurrentUser);
  const isFloorOwner = useOfficeStore((s) => s.isFloorOwner);
  const isViewMode = !isFloorOwner || editorMode !== 'edit';

  const appState = useOfficeStore((s) => s.excalidrawAppState);
  const setZones = useOfficeStore((s) => s.setZones);
  const prevModeRef = useRef(editorMode);

  // Re-generate seats every time user switches edit → view
  useEffect(() => {
    if (prevModeRef.current === 'edit' && editorMode !== 'edit' && excalidrawAPI) {
      const elements = excalidrawAPI.getSceneElements();
      if (elements && elements.length > 0) {
        const desks = elements.filter((el: any) =>
          el.type === 'rectangle' && !el.isDeleted &&
          el.backgroundColor === '#e8e3dd' && el.width > 40 && el.width < 120
        );
        const allChairs = elements.filter((el: any) =>
          el.type === 'ellipse' && !el.isDeleted &&
          el.backgroundColor === '#9ca3af' && el.width <= 30 && el.height <= 30
        );
        const deskChairs: any[] = [];
        const otherChairs: any[] = [];
        for (const chair of allChairs) {
          const cx = chair.x + chair.width / 2, cy = chair.y + chair.height / 2;
          const nearDesk = desks.some((d: any) => Math.abs(cx - (d.x + d.width / 2)) < 60 && Math.abs(cy - (d.y + d.height / 2)) < 60);
          (nearDesk ? deskChairs : otherChairs).push(chair);
        }
        const sortFn = (a: any, b: any) => { const dy = a.y - b.y; return Math.abs(dy) > 10 ? dy : a.x - b.x; };
        const sorted = [...deskChairs.sort(sortFn), ...otherChairs.sort(sortFn)];

        const zones = [{ id: 'office', type: 'desk' as const, name: 'オフィス', x: 0, y: 0, w: 0, h: 0,
          seats: sorted.map((c: any, i: number) => ({ id: `seat-${i}`, roomId: 'office', x: c.x, y: c.y, w: c.width, h: c.height, occupied: false, occupiedBy: undefined as string | undefined })),
        }];
        useOfficeStore.setState({ zones });
      }
    }
    prevModeRef.current = editorMode;
  }, [editorMode, excalidrawAPI, setZones]);

  const zones = useOfficeStore((s) => s.zones);
  const sitAt = useOfficeStore((s) => s.sitAt);
  const standUp = useOfficeStore((s) => s.standUp);
  const currentSeatId = useOfficeStore((s) => s.currentSeatId);

  // Click = find nearest empty chair and sit, or free move
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (!isViewMode || !excalidrawAPI) return;
    const state = excalidrawAPI.getAppState();
    if (!state) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;

    const zoom = state.zoom?.value || 1;
    const scrollX = state.scrollX || 0;
    const scrollY = state.scrollY || 0;
    const offsetLeft = state.offsetLeft || 0;
    const offsetTop = state.offsetTop || 0;

    const sceneX = (e.clientX - rect.left - offsetLeft) / zoom - scrollX;
    const sceneY = (e.clientY - rect.top - offsetTop) / zoom - scrollY;

    // Check if clicking near an empty seat (within 20px)
    const SEAT_CLICK_RADIUS = 20;
    let closestSeat: { id: string; x: number; y: number; dist: number } | null = null;
    for (const zone of zones) {
      for (const seat of zone.seats) {
        if (seat.occupied && seat.occupiedBy !== currentUser.id) continue;
        const dist = Math.hypot(sceneX - seat.x, sceneY - seat.y);
        if (dist < SEAT_CLICK_RADIUS && (!closestSeat || dist < closestSeat.dist)) {
          closestSeat = { id: seat.id, x: seat.x, y: seat.y, dist };
        }
      }
    }

    const wsSend = (window as unknown as Record<string, any>).__wsSend;
    if (closestSeat) {
      if (currentSeatId) {
        standUp();
        wsSend?.stand?.();
      }
      sitAt(closestSeat.id);
      moveCurrentUser(closestSeat.x, closestSeat.y);
      wsSend?.sit?.(closestSeat.id, closestSeat.x, closestSeat.y);
    } else {
      if (currentSeatId) {
        standUp();
        wsSend?.stand?.();
      }
      moveCurrentUser(sceneX, sceneY);
    }
  }, [isViewMode, excalidrawAPI, moveCurrentUser, zones, sitAt, standUp, currentSeatId, currentUser.id]);

  useEffect(() => {
    const update = () => { if (ref.current) setH(ref.current.clientHeight); };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const currentAction = useOfficeStore((s) => s.currentAction);

  // Keyboard: Esc = stand up
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && currentSeatId && isViewMode) {
        standUp();
        const wsSend = (window as unknown as Record<string, any>).__wsSend;
        wsSend?.stand?.();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentSeatId, isViewMode, standUp]);

  const chatMessages = useOfficeStore((s) => s.chatMessages);
  const sendMessage = useOfficeStore((s) => s.sendMessage);
  const [chatInput, setChatInput] = useState('');
  const [hoveredUser, setHoveredUser] = useState<{ user: User; screenX: number; screenY: number } | null>(null);

  const handleSend = () => {
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    // Only send via WS — message comes back from server for all users including self
    const wsSend = (window as unknown as Record<string, any>).__wsSend;
    if (wsSend?.chat) wsSend.chat(text);
    setChatInput('');
  };

  // Find zone/action info for a user
  const getUserSeatInfo = useCallback((userId: string) => {
    for (const zone of zones) {
      const seat = zone.seats.find(s => s.occupiedBy === userId);
      if (seat) {
        const actionMap: Record<string, string> = { desk: 'working', meeting: 'meeting', lounge: 'break', cafe: 'break', open: 'idle' };
        return { zoneName: zone.name, action: actionMap[zone.type] || 'idle' };
      }
    }
    return null;
  }, [zones]);

  const searchQuery = useOfficeStore((s) => s.searchQuery);
  const reactions = useOfficeStore((s) => s.reactions);
  const allUsers = [...users, currentUser];

  return (
    <div ref={ref} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <style>{`
        @keyframes reaction-pop {
          0% { transform: translateX(-50%) scale(0) translateY(10px); opacity: 0; }
          50% { transform: translateX(-50%) scale(1.3) translateY(-5px); }
          100% { transform: translateX(-50%) scale(1) translateY(0); opacity: 1; }
        }
        @keyframes search-pulse {
          0%, 100% { box-shadow: 0 0 8px 2px rgba(245,158,11,0.4); }
          50% { box-shadow: 0 0 16px 6px rgba(245,158,11,0.7); }
        }
      `}</style>
      {/* Excalidraw — always mounted, viewMode toggled */}
      <div style={{ width: '100%', height: `${h}px` }}>
        <Editor viewMode={isViewMode} floorSlug={floorSlug} savedScene={savedScene} />
      </div>

      {/* Avatar overlay in view mode */}
      {isViewMode && appState && (
        <div
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}
          onClick={handleCanvasClick}
        >
          {/* Proximity lines between nearby users */}
          <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
            {allUsers.map((a, i) => allUsers.slice(i + 1).map(b => {
              const dist = Math.hypot(a.position.x - b.position.x, a.position.y - b.position.y);
              if (dist > PROXIMITY_DIST || a.status === 'offline' || b.status === 'offline') return null;
              const posA = sceneToScreen(a.position.x, a.position.y, appState);
              const posB = sceneToScreen(b.position.x, b.position.y, appState);
              const alpha = (1 - dist / PROXIMITY_DIST) * 0.4;
              return (
                <line key={`${a.id}-${b.id}`}
                  x1={posA.x + 11} y1={posA.y + 11} x2={posB.x + 11} y2={posB.y + 11}
                  stroke={`rgba(99,102,241,${alpha})`} strokeWidth={1.5} strokeDasharray="4 3"
                />
              );
            }))}
          </svg>

          {allUsers.map((user) => {
            const pos = sceneToScreen(user.position.x, user.position.y, appState);
            const isCurrent = user.id === currentUser.id;
            const zoom = appState.zoom?.value || 1;
            const size = Math.max(28, 36 * zoom);
            const sq = searchQuery.trim().toLowerCase();
            const isSearching = sq.length > 0;
            const isMatch = isSearching && user.name.toLowerCase().includes(sq);
            const isDimmed = isSearching && !isMatch;

            return (
              <div
                key={user.id}
                onMouseEnter={() => setHoveredUser({ user, screenX: pos.x, screenY: pos.y })}
                onMouseLeave={() => setHoveredUser(null)}
                style={{
                  position: 'absolute',
                  left: pos.x - size / 2,
                  top: pos.y - size / 2,
                  transition: 'left 0.5s ease, top 0.5s ease, opacity 0.3s ease, filter 0.3s ease',
                  pointerEvents: 'auto',
                  zIndex: isMatch ? 30 : isCurrent ? 20 : 10,
                  opacity: isDimmed ? 0.3 : 1,
                  filter: isDimmed ? 'grayscale(0.8)' : 'none',
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: size, height: size, borderRadius: '50%',
                  border: `${isMatch ? 3 : isCurrent ? 3 : 2}px solid ${isMatch ? '#F59E0B' : isCurrent ? '#4F46E5' : STATUS_COLORS[user.status]}`,
                  overflow: 'hidden', background: '#fff',
                  boxShadow: isMatch ? '0 0 12px 4px rgba(245,158,11,0.5)' : '0 2px 8px rgba(0,0,0,0.15)',
                  animation: isMatch ? 'search-pulse 1.5s ease-in-out infinite' : 'none',
                }}>
                  <img
                    src={getAvatarUrl(user.avatarSeed || user.name, user.avatarStyle || 'notionists')}
                    alt={user.name}
                    style={{ width: '100%', height: '100%', display: 'block' }}
                    draggable={false}
                  />
                </div>
                {/* Status dot */}
                <div style={{
                  position: 'absolute', bottom: -1, right: -1,
                  width: 10, height: 10, borderRadius: '50%',
                  background: STATUS_COLORS[user.status],
                  border: '2px solid #fff',
                }} />
                {/* Mute indicator */}
                {/* Reaction bubble */}
                {reactions[user.id] && (
                  <div style={{
                    position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)',
                    fontSize: 24, animation: 'reaction-pop 0.3s ease-out',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                    zIndex: 30, pointerEvents: 'none',
                  }}>
                    {reactions[user.id]}
                  </div>
                )}
                {/* Name */}
                {(zoom > 0.5 || isMatch) && (
                  <div style={{
                    position: 'absolute', top: size + 2, left: '50%', transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap', fontSize: isMatch ? 11 : 10, fontWeight: isMatch ? 700 : 600,
                    color: isMatch ? '#92400E' : '#374151',
                    background: isMatch ? '#FEF3C7' : 'rgba(255,255,255,0.9)',
                    borderRadius: 6, padding: isMatch ? '2px 8px' : '1px 6px',
                    boxShadow: isMatch ? '0 2px 8px rgba(245,158,11,0.3)' : '0 1px 3px rgba(0,0,0,0.08)',
                    border: isMatch ? '1px solid #F59E0B' : 'none',
                  }}>
                    {isMatch ? '🔍 ' : ''}{user.name.split(' ')[0]}{isCurrent ? ' (You)' : ''}
                  </div>
                )}
                {/* Action badge */}
                {isCurrent && currentAction !== 'idle' && ACTION_EMOJI[currentAction] && (
                  <div style={{
                    position: 'absolute', top: -4, right: -4,
                    fontSize: 12, background: '#fff', borderRadius: '50%',
                    width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)', zIndex: 25,
                  }}>
                    {ACTION_EMOJI[currentAction]}
                  </div>
                )}
                {/* Chat bubble */}
                {chatMessages.filter(m => m.userId === user.id && Date.now() - m.timestamp < 5000).slice(-1).map(m => (
                  <div key={m.timestamp} style={{
                    position: 'absolute', bottom: size + 4, left: '50%', transform: 'translateX(-50%)',
                    background: '#fff', borderRadius: 8, padding: '4px 8px', fontSize: 11,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)', whiteSpace: 'nowrap', maxWidth: 150,
                    overflow: 'hidden', textOverflow: 'ellipsis', zIndex: 30,
                    border: '1px solid #e5e5e5',
                  }}>
                    {m.text}
                  </div>
                ))}
              </div>
            );
          })}

          {/* Stand up button */}
          {currentSeatId && (
            <button onClick={(e) => { e.stopPropagation(); standUp(); const ws = (window as unknown as Record<string, any>).__wsSend; ws?.stand?.(); }} style={{
              position: 'fixed', bottom: 60, left: '50%', transform: 'translateX(-50%)',
              zIndex: 50, pointerEvents: 'auto', padding: '6px 16px', borderRadius: 16,
              border: '1px solid #e5e5e5', background: 'rgba(255,255,255,0.95)', cursor: 'pointer',
              fontSize: 12, color: '#6B7280', boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              🚶 立ち上がる（Esc）
            </button>
          )}

          {/* Chat input */}
          <div style={{
            position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
            zIndex: 50, pointerEvents: 'auto',
            display: 'flex', gap: 8, alignItems: 'center',
          }} onClick={e => e.stopPropagation()}>
            <input
              type="text" value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
              placeholder="メッセージを入力..."
              style={{
                width: 280, padding: '8px 14px', borderRadius: 20,
                border: '1px solid #e5e5e5', fontSize: 13, outline: 'none',
                background: 'rgba(255,255,255,0.95)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            />
            <button onClick={handleSend} style={{
              width: 36, height: 36, borderRadius: '50%', border: 'none',
              background: '#4F46E5', color: '#fff', cursor: 'pointer', fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(79,70,229,0.3)',
            }}>↑</button>
          </div>

          {/* Avatar Hover Tooltip */}
          {hoveredUser && (() => {
            const seatInfo = getUserSeatInfo(hoveredUser.user.id);
            const isCur = hoveredUser.user.id === currentUser.id;
            const actionLabel = isCur && currentAction !== 'idle' ? ACTION_LABELS[currentAction] : (seatInfo ? ACTION_LABELS[seatInfo.action] : null);
            return (
              <div style={{
                position: 'absolute',
                left: hoveredUser.screenX + 24,
                top: hoveredUser.screenY - 20,
                zIndex: 100,
                pointerEvents: 'none',
                background: '#fff',
                borderRadius: 10,
                padding: '10px 14px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)',
                minWidth: 160,
                border: '1px solid #f0f0f0',
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1f2937', marginBottom: 2 }}>
                  {hoveredUser.user.name}
                </div>
                {hoveredUser.user.role && (
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>
                    {hoveredUser.user.role}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#374151', marginBottom: seatInfo || actionLabel ? 4 : 0 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: STATUS_COLORS[hoveredUser.user.status],
                    display: 'inline-block', flexShrink: 0,
                  }} />
                  {STATUS_LABELS[hoveredUser.user.status]}
                </div>
                {actionLabel && (
                  <div style={{ fontSize: 11, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {ACTION_EMOJI[isCur ? currentAction : (seatInfo?.action || 'idle')]} {actionLabel}
                  </div>
                )}
                {seatInfo && (
                  <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>
                    📍 {seatInfo.zoneName}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Quick Actions Bar */}
          <div style={{
            position: 'fixed', top: 60, left: '50%', transform: 'translateX(-50%)',
            zIndex: 50, pointerEvents: 'auto',
            display: 'flex', alignItems: 'center', gap: 2,
            background: 'rgba(255,255,255,0.95)', borderRadius: 12,
            padding: '6px 10px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.06)',
            border: '1px solid #f0f0f0',
          }} onClick={e => e.stopPropagation()}>
            {/* Status indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px 0 4px', borderRight: '1px solid #e5e7eb', marginRight: 4 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: STATUS_COLORS[currentUser.status],
              }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
                {STATUS_LABELS[currentUser.status]}
              </span>
            </div>

            {/* Seat info */}
            {currentSeatId && (() => {
              const seatLabel = zones.flatMap(z => z.seats).find(s => s.id === currentSeatId)?.label;
              return seatLabel ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 8px', fontSize: 11, color: '#6366F1', fontWeight: 500 }}>
                  📍 {seatLabel}
                </div>
              ) : null;
            })()}
          </div>

          {/* Stamp palette */}
          <div style={{
            position: 'fixed', bottom: currentSeatId ? 110 : 60, left: '50%', transform: 'translateX(-50%)',
            zIndex: 50, pointerEvents: 'auto',
            display: 'flex', gap: 4, background: 'rgba(255,255,255,0.95)', borderRadius: 12,
            padding: '4px 8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0',
          }} onClick={e => e.stopPropagation()}>
            {['👋', '👍', '👏', '😂', '❤️', '🎉', '🤔', '☕'].map(emoji => (
              <button key={emoji} onClick={() => {
                const wsSend = (window as unknown as Record<string, any>).__wsSend;
                wsSend?.reaction?.(emoji);
                // Also show own reaction
                useOfficeStore.setState(s => ({ reactions: { ...s.reactions, [currentUser.id]: emoji } }));
                setTimeout(() => useOfficeStore.setState(s => { const { [currentUser.id]: _, ...rest } = s.reactions; return { reactions: rest }; }), 3000);
              }} style={{
                width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent',
                cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'transform 0.1s, background 0.1s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.transform = 'scale(1.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
              >{emoji}</button>
            ))}
          </div>

          {/* Seat indicators with labels */}
          {zones.flatMap(z => z.seats).map((seat: any, i) => {
            if (seat.occupied && seat.occupiedBy !== currentUser.id) return null;
            const zoom = appState.zoom?.value || 1;
            const sw = (seat.w || 22) * zoom;
            const sh = (seat.h || 22) * zoom;
            const pos = sceneToScreen(seat.x, seat.y, appState);
            const isEmpty = !seat.occupied;
            return (
              <div key={`seat-${seat.id}-${i}`} title={isEmpty ? `${seat.label || seat.id} - クリックして座る` : seat.label || seat.id} style={{
                position: 'absolute', left: pos.x, top: pos.y, width: sw, height: sh,
                borderRadius: '50%', border: isEmpty ? '2px dashed rgba(99,102,241,0)' : 'none',
                cursor: isEmpty ? 'pointer' : 'default', pointerEvents: isEmpty ? 'auto' : 'none', zIndex: 5,
                transition: 'border-color 0.2s, background 0.2s',
              }}
              onMouseEnter={isEmpty ? (e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; }) : undefined}
              onMouseLeave={isEmpty ? (e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0)'; e.currentTarget.style.background = 'transparent'; }) : undefined}
              onClick={isEmpty ? (e => { e.stopPropagation(); const ws = (window as unknown as Record<string, any>).__wsSend; if (currentSeatId) { standUp(); ws?.stand?.(); } sitAt(seat.id); moveCurrentUser(seat.x, seat.y); ws?.sit?.(seat.id, seat.x, seat.y); }) : undefined}
              >
                {/* Empty seat + icon */}
                {isEmpty && zoom > 0.3 && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'rgba(99,102,241,0.3)', fontSize: sw * 0.6, fontWeight: 300,
                    pointerEvents: 'none', lineHeight: 1,
                  }}>
                    +
                  </div>
                )}
                {/* Seat label */}
                {seat.label && zoom > 0.4 && (
                  <div style={{
                    position: 'absolute', top: sh + 1, left: '50%', transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap', fontSize: 8, fontWeight: 600,
                    color: isEmpty ? '#6366F1' : '#9CA3AF',
                    background: isEmpty ? 'rgba(238,242,255,0.9)' : 'rgba(243,244,246,0.9)',
                    borderRadius: 3, padding: '0px 3px',
                    pointerEvents: 'none',
                  }}>
                    {seat.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
