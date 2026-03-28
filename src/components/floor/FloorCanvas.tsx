'use client';

import dynamic from 'next/dynamic';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import { getAvatarUrl } from './assets';

const Editor = dynamic(() => import('./ExcalidrawEditor'), {
  ssr: false,
  loading: () => <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>読み込み中...</div>,
});

const STATUS_COLORS: Record<string, string> = {
  online: '#4CAF50', busy: '#F44336', focusing: '#FF9800', offline: '#BDBDBD',
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

export default function FloorCanvas() {
  const ref = useRef<HTMLDivElement>(null);
  const [h, setH] = useState(600);
  const editorMode = useOfficeStore((s) => s.editorMode);
  const users = useOfficeStore((s) => s.users);
  const currentUser = useOfficeStore((s) => s.currentUser);
  const excalidrawAPI = useOfficeStore((s) => s.excalidrawAPI);
  const moveCurrentUser = useOfficeStore((s) => s.moveCurrentUser);
  const isViewMode = editorMode !== 'edit';

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
          seats: sorted.map((c: any, i: number) => ({ id: `seat-${i}`, roomId: 'office', x: c.x, y: c.y, w: c.width, h: c.height, occupied: false })),
        }];
        const store = useOfficeStore.getState();
        const allSeats = zones[0].seats;
        const updatedUsers = store.users.map((user, idx) => {
          if (idx < allSeats.length) {
            allSeats[idx].occupied = true;
            allSeats[idx].occupiedBy = user.id;
            return { ...user, position: { x: allSeats[idx].x, y: allSeats[idx].y } };
          }
          return user;
        });
        useOfficeStore.setState({ zones, users: updatedUsers });
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

    if (closestSeat) {
      // Stand up from current seat first, then sit at new one
      if (currentSeatId) standUp();
      sitAt(closestSeat.id);
      moveCurrentUser(closestSeat.x, closestSeat.y);
    } else {
      // Free move (stand up if seated)
      if (currentSeatId) standUp();
      moveCurrentUser(sceneX, sceneY);
    }
  }, [isViewMode, excalidrawAPI, moveCurrentUser, zones, sitAt, standUp, currentSeatId, currentUser.id]);

  useEffect(() => {
    const update = () => { if (ref.current) setH(ref.current.clientHeight); };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const allUsers = [...users, currentUser];

  return (
    <div ref={ref} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Excalidraw — always mounted, viewMode toggled */}
      <div style={{ width: '100%', height: `${h}px` }}>
        <Editor viewMode={isViewMode} />
      </div>

      {/* Avatar overlay in view mode */}
      {isViewMode && appState && (
        <div
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}
          onClick={handleCanvasClick}
        >
          {allUsers.map((user) => {
            const pos = sceneToScreen(user.position.x, user.position.y, appState);
            const isCurrent = user.id === currentUser.id;
            const zoom = appState.zoom?.value || 1;
            const size = Math.max(28, 36 * zoom);

            return (
              <div
                key={user.id}
                style={{
                  position: 'absolute',
                  left: pos.x - size / 2,
                  top: pos.y - size / 2,
                  transition: 'left 0.5s ease, top 0.5s ease',
                  pointerEvents: 'auto',
                  zIndex: isCurrent ? 20 : 10,
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: size, height: size, borderRadius: '50%',
                  border: `${isCurrent ? 3 : 2}px solid ${isCurrent ? '#4F46E5' : STATUS_COLORS[user.status]}`,
                  overflow: 'hidden', background: '#fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
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
                {/* Name */}
                {zoom > 0.5 && (
                  <div style={{
                    position: 'absolute', top: size + 2, left: '50%', transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap', fontSize: 10, fontWeight: 600, color: '#374151',
                    background: 'rgba(255,255,255,0.9)', borderRadius: 6, padding: '1px 6px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  }}>
                    {user.name.split(' ')[0]}{isCurrent ? ' (You)' : ''}
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty seat indicators */}
          {zones.flatMap(z => z.seats).filter(s => !s.occupied).map((seat: any, i) => {
            const zoom = appState.zoom?.value || 1;
            const sw = (seat.w || 22) * zoom;
            const sh = (seat.h || 22) * zoom;
            const pos = sceneToScreen(seat.x, seat.y, appState);
            return (
              <div key={`empty-${i}`} title="クリックして座る" style={{
                position: 'absolute', left: pos.x, top: pos.y, width: sw, height: sh,
                borderRadius: '50%', border: '2px dashed rgba(99,102,241,0)',
                cursor: 'pointer', pointerEvents: 'auto', zIndex: 5,
                transition: 'border-color 0.2s, background 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0)'; e.currentTarget.style.background = 'transparent'; }}
              onClick={e => { e.stopPropagation(); if (currentSeatId) standUp(); sitAt(seat.id); moveCurrentUser(seat.x, seat.y); }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
