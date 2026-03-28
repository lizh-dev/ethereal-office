'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import { Room, Furniture, User, Point } from '@/types';
import { liveRooms } from '@/data/floorPlan';
import { preloadAvatars } from './assets';
import { drawModernFurniture } from './furnitureSvgs';

const STATUS_COLORS: Record<string, string> = {
  online: '#4CAF50', busy: '#F44336', focusing: '#FF9800', offline: '#BDBDBD',
};

const PROXIMITY_DIST = 80;

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
}

// ── ROOM ─────────────────────────────────────────────────
function drawRoom(ctx: CanvasRenderingContext2D, room: Room, isSel: boolean, t: number) {
  ctx.save();
  // Clean modern fill — white/near-white
  ctx.shadowColor = 'rgba(0,0,0,0.04)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = '#FFFFFF';
  rr(ctx, room.x, room.y, room.w, room.h, 8); ctx.fill();
  ctx.shadowColor = 'transparent';
  // Thin border
  ctx.strokeStyle = isSel ? '#6366F1' : '#E5E5E5';
  ctx.lineWidth = isSel ? 2 : 1;
  rr(ctx, room.x, room.y, room.w, room.h, 8); ctx.stroke();

  if (isSel) {
    ctx.strokeStyle = '#1976D2'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
    rr(ctx, room.x - 3, room.y - 3, room.w + 6, room.h + 6, 7); ctx.stroke(); ctx.setLineDash([]);
  }

  // LIVE badge
  const isLive = liveRooms.has(room.id);
  const lx = room.x + 6, ly = room.y + 6;
  if (isLive) {
    ctx.fillStyle = '#E53935';
    rr(ctx, lx, ly, 38, 15, 3); ctx.fill();
    const p = Math.sin(t * 0.004) * 0.3 + 0.7;
    ctx.globalAlpha = p; ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(lx + 8, ly + 7.5, 2, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillStyle = '#fff';
    ctx.font = 'bold 7px system-ui'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('LIVE', lx + 14, ly + 8);
  }

  // Room name
  const nx = isLive ? lx + 42 : lx;
  ctx.font = '600 8.5px system-ui'; const txt = room.name.toUpperCase();
  const tw = ctx.measureText(txt).width;
  ctx.fillStyle = '#F5F5F5';
  rr(ctx, nx, ly, tw + 8, 15, 4); ctx.fill();
  ctx.fillStyle = '#6B7280'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(txt, nx + 4, ly + 8);
  ctx.restore();
}

// ── FURNITURE — clean architectural floor plan style ─────
function drawFurniture(ctx: CanvasRenderingContext2D, f: Furniture, isSel: boolean) {
  drawModernFurniture(ctx, f, isSel);
}

// ── PROXIMITY LINES ──────────────────────────────────────
function drawProximity(ctx: CanvasRenderingContext2D, pos: Point[], t: number) {
  for (let i = 0; i < pos.length; i++) {
    for (let j = i + 1; j < pos.length; j++) {
      const a = pos[i], b = pos[j];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < PROXIMITY_DIST) {
        const alpha = (1 - d / PROXIMITY_DIST) * 0.25;
        ctx.strokeStyle = `rgba(99,102,241,${alpha})`;
        ctx.lineWidth = 1.5; ctx.shadowColor = `rgba(99,102,241,${alpha * 0.5})`; ctx.shadowBlur = 5;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.shadowColor = 'transparent';
      }
    }
  }
}

// ── AVATAR — DiceBear illustrated face ───────────────────
function drawAvatar(
  ctx: CanvasRenderingContext2D, user: User, isCurrent: boolean,
  avatarImgs: Record<string, HTMLImageElement>
) {
  const { x, y } = user.position;
  const r = isCurrent ? 20 : 16;
  ctx.save();

  // Status ring
  ctx.strokeStyle = STATUS_COLORS[user.status];
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(x, y, r + 2, 0, Math.PI * 2); ctx.stroke();

  // White border
  ctx.shadowColor = 'rgba(0,0,0,0.2)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath(); ctx.arc(x, y, r + 0.5, 0, Math.PI * 2); ctx.fill();
  ctx.shadowColor = 'transparent';

  // Avatar image (DiceBear)
  const img = avatarImgs[user.name];
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.beginPath(); ctx.arc(x, y, r - 1, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#F5EDE3';
    ctx.beginPath(); ctx.arc(x, y, r - 1, 0, Math.PI * 2); ctx.fill();
    ctx.drawImage(img, x - r + 1, y - r + 1, (r - 1) * 2, (r - 1) * 2);
  } else {
    // Fallback: colored circle + initials
    ctx.fillStyle = user.avatarColor;
    ctx.beginPath(); ctx.arc(x, y, r - 1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${isCurrent ? 12 : 9}px system-ui`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(user.initials, x, y + 0.5);
  }
  ctx.restore();

  // Status dot
  const da = Math.PI * 0.3;
  const dx = x + Math.cos(da) * r, dy = y + Math.sin(da) * r;
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(dx, dy, 4.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = STATUS_COLORS[user.status];
  ctx.beginPath(); ctx.arc(dx, dy, 3, 0, Math.PI * 2); ctx.fill();

  // Name pill
  const name = user.name.split(' ')[0];
  ctx.font = '500 9px system-ui';
  const nw = ctx.measureText(name).width;
  const pw = nw + 8, px = x - pw / 2, py = y + r + 5;
  ctx.shadowColor = 'rgba(0,0,0,0.08)'; ctx.shadowBlur = 3; ctx.shadowOffsetY = 1;
  ctx.fillStyle = '#fff';
  rr(ctx, px, py, pw, 14, 7); ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#374151'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(name, x, py + 7);
}

// ── GRID ─────────────────────────────────────────────────
function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number, gs: number) {
  ctx.strokeStyle = 'rgba(0,0,0,0.03)'; ctx.lineWidth = 0.5;
  for (let gx = 0; gx <= w; gx += gs) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke(); }
  for (let gy = 0; gy <= h; gy += gs) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke(); }
}

// ── MAIN ─────────────────────────────────────────────────
export default function FloorCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });
  const spaceHeldRef = useRef(false);
  const curPosRef = useRef<Point>({ x: 500, y: 280 });
  const avatarImgsRef = useRef<Record<string, HTMLImageElement>>({});
  const [avatarsLoaded, setAvatarsLoaded] = useState(false);

  // Selection rectangle for multi-select
  const [selRect, setSelRect] = useState<{ start: Point; end: Point } | null>(null);
  const [selectedIds, setSelectedIds] = useState<{ rooms: string[]; furniture: string[] }>({ rooms: [], furniture: [] });

  // Context menu — supports room, furniture, and multi-selection
  const [contextMenu, setContextMenu] = useState<{
    x: number; y: number;
    type: 'room' | 'furniture' | 'multi' | 'empty';
    id?: string; name?: string;
  } | null>(null);

  const {
    floorPlan, users, currentUser, editorMode, camera,
    selectedFurnitureId, selectedRoomId, showGrid,
    setCamera, moveCurrentUser, selectFurniture, selectRoom,
    updateFurniture, updateRoom, setDraggingItem, draggingItem,
    removeRoom, removeFurniture,
  } = useOfficeStore();

  // Load DiceBear avatars using each user's seed/style
  const avatarKey = `${currentUser.name}-${currentUser.avatarSeed}-${currentUser.avatarStyle}-${users.length}`;
  useEffect(() => {
    const allUsers = [currentUser, ...users];
    preloadAvatars(allUsers).then((imgs) => {
      avatarImgsRef.current = imgs;
      setAvatarsLoaded(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatarKey]);

  // Space key for pan mode
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.code === 'Space' && !e.repeat) { spaceHeldRef.current = true; e.preventDefault(); } };
    const up = (e: KeyboardEvent) => { if (e.code === 'Space') { spaceHeldRef.current = false; } };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // Refs for render loop access
  const selRectRef = useRef<{ start: Point; end: Point } | null>(null);
  const selIdsRef = useRef<{ rooms: string[]; furniture: string[] }>({ rooms: [], furniture: [] });

  // Sync state to refs
  useEffect(() => { selRectRef.current = selRect; }, [selRect]);
  useEffect(() => { selIdsRef.current = selectedIds; }, [selectedIds]);

  const storeRef = useRef(useOfficeStore.getState());
  useEffect(() => {
    return useOfficeStore.subscribe(s => { storeRef.current = s; });
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) { animRef.current = requestAnimationFrame(render); return; }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Always read latest state from store ref
    const st = storeRef.current;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const t = performance.now();

    ctx.fillStyle = '#F5F5F5';
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.save();
    ctx.translate(-st.camera.x, -st.camera.y);
    ctx.scale(st.camera.zoom, st.camera.zoom);

    // Dot grid
    if (st.showGrid || st.editorMode === 'edit') {
      ctx.fillStyle = 'rgba(0,0,0,0.04)';
      const gs = st.floorPlan.gridSize;
      const startX = Math.floor(st.camera.x / st.camera.zoom / gs) * gs - gs;
      const startY = Math.floor(st.camera.y / st.camera.zoom / gs) * gs - gs;
      const endX = startX + (rect.width / st.camera.zoom) + gs * 2;
      const endY = startY + (rect.height / st.camera.zoom) + gs * 2;
      for (let gx = startX; gx < endX; gx += gs) {
        for (let gy = startY; gy < endY; gy += gs) {
          ctx.beginPath(); ctx.arc(gx, gy, 0.8, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    // Read multi-select from component state via ref
    const selIds = selIdsRef.current;

    // Rooms
    st.floorPlan.rooms.forEach(room => {
      const isSel = (st.editorMode === 'edit' && st.selectedRoomId === room.id) || selIds.rooms.includes(room.id);
      drawRoom(ctx, room, isSel, t);
    });
    // Furniture
    st.floorPlan.furniture.forEach(f => {
      const isSel = (st.editorMode === 'edit' && st.selectedFurnitureId === f.id) || selIds.furniture.includes(f.id);
      drawFurniture(ctx, f, isSel);
    });

    // Selection rectangle
    const sr = selRectRef.current;
    if (sr) {
      const sx = Math.min(sr.start.x, sr.end.x), sy = Math.min(sr.start.y, sr.end.y);
      const sw = Math.abs(sr.end.x - sr.start.x), sh = Math.abs(sr.end.y - sr.start.y);
      ctx.fillStyle = 'rgba(99,102,241,0.08)';
      ctx.fillRect(sx, sy, sw, sh);
      ctx.strokeStyle = 'rgba(99,102,241,0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(sx, sy, sw, sh);
      ctx.setLineDash([]);
    }

    // Animate current user
    const target = st.currentUser.targetPosition || st.currentUser.position;
    const ddx = target.x - curPosRef.current.x, ddy = target.y - curPosRef.current.y;
    const dist = Math.hypot(ddx, ddy);
    if (dist > 0.5) {
      const spd = Math.min(dist * 0.1, 6);
      curPosRef.current.x += (ddx / dist) * spd;
      curPosRef.current.y += (ddy / dist) * spd;
    } else curPosRef.current = { ...target };

    // Proximity
    const allPos = [...st.users.map(u => u.position), { ...curPosRef.current }];
    drawProximity(ctx, allPos, t);

    // Avatars
    st.users.forEach(u => drawAvatar(ctx, u, false, avatarImgsRef.current));
    drawAvatar(ctx, { ...st.currentUser, position: { ...curPosRef.current } }, true, avatarImgsRef.current);

    ctx.restore();
    animRef.current = requestAnimationFrame(render);
  }, []);

  useEffect(() => {
    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [render]);

  // Helper: screen → world
  const s2w = (sx: number, sy: number): Point => {
    const st = storeRef.current;
    return { x: (sx + st.camera.x) / st.camera.zoom, y: (sy + st.camera.y) / st.camera.zoom };
  };

  // Hit-test helpers
  const hitFurniture = (w: Point) => {
    const fp = storeRef.current.floorPlan;
    for (let i = fp.furniture.length - 1; i >= 0; i--) {
      const f = fp.furniture[i];
      if (w.x >= f.x && w.x <= f.x + f.w && w.y >= f.y && w.y <= f.y + f.h) return f;
    }
    return null;
  };
  const hitRoom = (w: Point) => {
    const fp = storeRef.current.floorPlan;
    for (let i = fp.rooms.length - 1; i >= 0; i--) {
      const r = fp.rooms[i];
      if (w.x >= r.x && w.x <= r.x + r.w && w.y >= r.y && w.y <= r.y + r.h) return r;
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setContextMenu(null);
    const rect = canvasRef.current?.getBoundingClientRect(); if (!rect) return;
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    const w = s2w(sx, sy);
    const st = storeRef.current;

    if (e.button === 1) {
      setIsPanning(true); setPanStart({ x: e.clientX + st.camera.x, y: e.clientY + st.camera.y }); return;
    }

    if (e.button === 0 && st.editorMode !== 'edit') {
      moveCurrentUser(w.x, w.y); return;
    }

    if (e.button === 0 && st.editorMode === 'edit') {
      // Space held = pan
      if (spaceHeldRef.current) {
        setIsPanning(true); setPanStart({ x: e.clientX + st.camera.x, y: e.clientY + st.camera.y }); return;
      }
      // Check furniture
      const fHit = hitFurniture(w);
      if (fHit) { selectFurniture(fHit.id); setDraggingItem({ type: 'furniture', id: fHit.id }); setSelectedIds({ rooms: [], furniture: [] }); return; }
      // Check room
      const rHit = hitRoom(w);
      if (rHit) { selectRoom(rHit.id); setDraggingItem({ type: 'room', id: rHit.id }); setSelectedIds({ rooms: [], furniture: [] }); return; }
      // Empty space: start selection rect
      selectFurniture(null); selectRoom(null); setSelectedIds({ rooms: [], furniture: [] });
      setSelRect({ start: w, end: w });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const st = storeRef.current;

    if (isPanning) {
      setCamera({ x: panStart.x - e.clientX, y: panStart.y - e.clientY }); return;
    }

    // Selection rect
    if (selRect && st.editorMode === 'edit') {
      const rect = canvasRef.current?.getBoundingClientRect(); if (!rect) return;
      const w = s2w(e.clientX - rect.left, e.clientY - rect.top);
      setSelRect(prev => prev ? { start: prev.start, end: w } : null);
      return;
    }

    // Dragging
    if (draggingItem && st.editorMode === 'edit') {
      const rect = canvasRef.current?.getBoundingClientRect(); if (!rect) return;
      const w = s2w(e.clientX - rect.left, e.clientY - rect.top);
      const gs = st.floorPlan.gridSize;
      const snap = { x: Math.round(w.x / gs) * gs, y: Math.round(w.y / gs) * gs };
      if (draggingItem.type === 'furniture') {
        const f = st.floorPlan.furniture.find(f => f.id === draggingItem.id);
        if (f) updateFurniture(draggingItem.id, { x: snap.x - f.w / 2, y: snap.y - f.h / 2 });
      } else {
        const r = st.floorPlan.rooms.find(r => r.id === draggingItem.id);
        if (r) {
          const dx = snap.x - r.w / 2 - r.x, dy = snap.y - r.h / 2 - r.y;
          updateRoom(draggingItem.id, { x: r.x + dx, y: r.y + dy });
          st.floorPlan.furniture.forEach(ff => {
            if (ff.x >= r.x && ff.x <= r.x + r.w && ff.y >= r.y && ff.y <= r.y + r.h) {
              updateFurniture(ff.id, { x: ff.x + dx, y: ff.y + dy });
            }
          });
        }
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingItem(null);

    // Finalize selection rect
    if (selRect) {
      const st = storeRef.current;
      const x1 = Math.min(selRect.start.x, selRect.end.x), y1 = Math.min(selRect.start.y, selRect.end.y);
      const x2 = Math.max(selRect.start.x, selRect.end.x), y2 = Math.max(selRect.start.y, selRect.end.y);

      if (Math.abs(x2 - x1) > 5 || Math.abs(y2 - y1) > 5) {
        const selRooms = st.floorPlan.rooms.filter(r => r.x >= x1 && r.x + r.w <= x2 && r.y >= y1 && r.y + r.h <= y2).map(r => r.id);
        const selFurn = st.floorPlan.furniture.filter(f => f.x >= x1 && f.x + f.w <= x2 && f.y >= y1 && f.y + f.h <= y2).map(f => f.id);
        setSelectedIds({ rooms: selRooms, furniture: selFurn });
      }
      setSelRect(null);
    }
  };

  // Right-click: works on room, furniture, multi-selection, or empty
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const st = storeRef.current;
    if (st.editorMode !== 'edit') return;

    const rect = canvasRef.current?.getBoundingClientRect(); if (!rect) return;
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    const w = s2w(sx, sy);

    // If multi-selected
    if (selectedIds.rooms.length + selectedIds.furniture.length > 0) {
      setContextMenu({ x: sx, y: sy, type: 'multi', name: `${selectedIds.rooms.length}スペース + ${selectedIds.furniture.length}家具` });
      return;
    }
    // Furniture
    const fHit = hitFurniture(w);
    if (fHit) {
      setContextMenu({ x: sx, y: sy, type: 'furniture', id: fHit.id, name: fHit.type });
      return;
    }
    // Room
    const rHit = hitRoom(w);
    if (rHit) {
      setContextMenu({ x: sx, y: sy, type: 'room', id: rHit.id, name: rHit.name });
      return;
    }
    setContextMenu({ x: sx, y: sy, type: 'empty' });
  };

  const handleDeleteSelected = () => {
    selectedIds.rooms.forEach(id => removeRoom(id));
    selectedIds.furniture.forEach(id => removeFurniture(id));
    setSelectedIds({ rooms: [], furniture: [] });
    setContextMenu(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const st = storeRef.current;
    if (e.ctrlKey || e.metaKey) {
      // Pinch zoom
      setCamera({ zoom: Math.max(0.3, Math.min(3, st.camera.zoom * (e.deltaY > 0 ? 0.92 : 1.08))) });
    } else {
      // Pan (trackpad two-finger scroll or shift+scroll)
      setCamera({ x: st.camera.x + e.deltaX, y: st.camera.y + e.deltaY });
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden" style={{ background: '#F5F5F5' }}>
      <canvas ref={canvasRef}
        className={`absolute inset-0 ${editorMode === 'edit' ? 'cursor-default' : 'cursor-pointer'}`}
        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onWheel={handleWheel}
        onContextMenu={handleContextMenu}
      />

      {/* Context menu backdrop */}
      {contextMenu && <div className="absolute inset-0 z-10" onClick={() => setContextMenu(null)} />}

      {/* Context menu */}
      {contextMenu && (
        <div className="absolute bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[170px] z-20 animate-float-in"
          style={{ left: contextMenu.x, top: contextMenu.y }}>
          <div className="px-3 py-1.5 text-[10px] text-gray-400 font-medium border-b border-gray-100">{contextMenu.name}</div>

          {contextMenu.type === 'room' && <>
            <button onClick={() => { removeRoom(contextMenu.id!); setContextMenu(null); }}
              className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50">🗑 削除</button>
          </>}

          {contextMenu.type === 'furniture' && <>
            <button onClick={() => { removeFurniture(contextMenu.id!); setContextMenu(null); }}
              className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50">🗑 削除</button>
          </>}

          {contextMenu.type === 'multi' && <>
            <button onClick={handleDeleteSelected}
              className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50">🗑 まとめて削除</button>
          </>}
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-200/50 overflow-hidden z-20">
        <button onClick={() => setCamera({ zoom: Math.min(3, camera.zoom * 1.2) })} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-500 text-sm">+</button>
        <div className="text-center text-[9px] font-medium text-gray-400 py-0.5 border-y border-gray-100">{Math.round(camera.zoom * 100)}%</div>
        <button onClick={() => setCamera({ zoom: Math.max(0.3, camera.zoom / 1.2) })} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-500 text-sm">−</button>
        <button
          onClick={() => {
            // Fit all rooms in view
            if (floorPlan.rooms.length === 0) { setCamera({ x: 0, y: 0, zoom: 1 }); return; }
            const minX = Math.min(...floorPlan.rooms.map(r => r.x));
            const minY = Math.min(...floorPlan.rooms.map(r => r.y));
            const maxX = Math.max(...floorPlan.rooms.map(r => r.x + r.w));
            const maxY = Math.max(...floorPlan.rooms.map(r => r.y + r.h));
            const cw = containerRef.current?.clientWidth || 800;
            const ch = containerRef.current?.clientHeight || 600;
            const zoom = Math.min(1.2, (cw - 40) / (maxX - minX + 80), (ch - 40) / (maxY - minY + 80));
            setCamera({ x: (minX - 40) * zoom, y: (minY - 40) * zoom, zoom });
          }}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-500 text-[10px] border-t border-gray-100"
          title="全体を表示"
        >⊡</button>
      </div>
    </div>
  );
}
