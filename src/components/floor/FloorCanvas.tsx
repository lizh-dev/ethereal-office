'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Group, Circle, Text, Ellipse, Transformer, Line, Image as KImage } from 'react-konva';
import Konva from 'konva';
import { useOfficeStore } from '@/store/officeStore';
import { Furniture, User, Point } from '@/types';
import { liveRooms } from '@/data/floorPlan';
import { preloadAvatars } from './assets';

const STATUS_COLORS: Record<string, string> = {
  online: '#4CAF50', busy: '#F44336', focusing: '#FF9800', offline: '#BDBDBD',
};

const SNAP_THRESHOLD = 8;

// ── Furniture render by type ─────────────────────────────
function FurnitureInner({ f }: { f: Furniture }) {
  const w = f.w, h = f.h;
  switch (f.type) {
    case 'desk': return (<>
      <Rect width={w} height={h} fill="#E8E3DD" cornerRadius={3} stroke="#D5D0CA" strokeWidth={0.8} />
      <Rect x={w / 2 - 11} y={2} width={22} height={10} fill="#475569" cornerRadius={1.5} />
      <Rect x={w / 2 - 10} y={3} width={20} height={8} fill="#818CF8" cornerRadius={1} />
      <Rect x={w / 2 - 14} y={h * 0.6} width={28} height={8} fill="#D1CCC6" cornerRadius={1.5} />
    </>);
    case 'chair': return (<>
      <Rect width={w} height={h} fill="#9CA3AF" cornerRadius={w * 0.3} />
      <Rect x={w * 0.1} y={-2} width={w * 0.8} height={4} fill="#78716C" cornerRadius={2} />
    </>);
    case 'sofa': return (<>
      <Rect width={w} height={h} fill="#C4BAB0" cornerRadius={6} />
      <Rect x={3} y={3} width={w / 2 - 4} height={h - 6} fill="#D4CBC2" cornerRadius={4} />
      <Rect x={w / 2 + 1} y={3} width={w / 2 - 4} height={h - 6} fill="#D4CBC2" cornerRadius={4} />
    </>);
    case 'table': return <Ellipse x={w / 2} y={h / 2} radiusX={w / 2} radiusY={h / 2} fill="#DDD8D2" stroke="#CCC7C0" strokeWidth={0.5} />;
    case 'plant': return (<>
      <Rect x={w * 0.28} y={h * 0.65} width={w * 0.44} height={h * 0.35} fill="#C0AD96" cornerRadius={3} />
      <Circle x={w / 2} y={h * 0.42} radius={w * 0.38} fill="#5EAD88" />
      <Circle x={w * 0.4} y={h * 0.32} radius={w * 0.2} fill="#86CEAB" />
    </>);
    case 'monitor': return (<>
      <Rect width={w} height={h - 2} fill="#374151" cornerRadius={1.5} />
      <Rect x={1.5} y={1.5} width={w - 3} height={h - 5} fill="#818CF8" cornerRadius={1} />
      <Rect x={w / 2 - 3} y={h - 2} width={6} height={2} fill="#6B7280" />
    </>);
    case 'whiteboard': return <Rect width={w} height={h} fill="#FFF" stroke="#D1CCC6" strokeWidth={0.6} cornerRadius={1.5} />;
    case 'printer': return (<>
      <Rect width={w} height={h} fill="#6B7280" cornerRadius={3} />
      <Rect x={2} y={2} width={w - 4} height={h * 0.35} fill="#F3F1EE" cornerRadius={1.5} />
    </>);
    case 'coffee-machine': return (<>
      <Rect width={w} height={h} fill="#4B4540" cornerRadius={4} />
      <Rect x={3} y={3} width={w - 6} height={h * 0.28} fill="#86EFAC" cornerRadius={2} />
    </>);
    case 'bookshelf': {
      const colors = ['#A45A5A', '#5A6FA4', '#5A9474', '#B8924A', '#7A62A4', '#5A9494'];
      const bw = Math.max(3.5, (w - 3) / colors.length - 0.5);
      return (<>
        <Rect width={w} height={h} fill="#7C6A54" cornerRadius={1.5} />
        {colors.map((c, i) => <Rect key={i} x={1.5 + i * (bw + 0.5)} y={1.5} width={bw} height={h - 3} fill={c} cornerRadius={0.5} />)}
      </>);
    }
    default: return <Rect width={w} height={h} fill="#E8E3DD" cornerRadius={3} />;
  }
}

// ── Avatar ───────────────────────────────────────────────
function AvatarShape({ user, isCurrent, avatarImg }: { user: User; isCurrent: boolean; avatarImg?: HTMLImageElement }) {
  const r = isCurrent ? 20 : 16;
  return (
    <Group x={user.position.x} y={user.position.y} listening={false}>
      <Circle radius={r + 2} stroke={STATUS_COLORS[user.status]} strokeWidth={2.5} />
      <Circle radius={r + 0.5} fill="#FFF" shadowColor="rgba(0,0,0,0.2)" shadowBlur={6} shadowOffsetY={2} />
      {avatarImg && avatarImg.complete && avatarImg.naturalWidth > 0 ? (
        <Group clipFunc={(ctx: any) => { ctx.arc(0, 0, r - 1, 0, Math.PI * 2); }}>
          <Circle radius={r - 1} fill="#F5EDE3" />
          <KImage image={avatarImg} x={-(r - 1)} y={-(r - 1)} width={(r - 1) * 2} height={(r - 1) * 2} />
        </Group>
      ) : (
        <>
          <Circle radius={r - 1} fill={user.avatarColor} />
          <Text text={user.initials} x={-r} y={-6} width={r * 2} align="center" fontSize={isCurrent ? 12 : 9} fontStyle="bold" fill="#FFF" />
        </>
      )}
      <Circle x={r * 0.7} y={r * 0.7} radius={4.5} fill="#FFF" />
      <Circle x={r * 0.7} y={r * 0.7} radius={3} fill={STATUS_COLORS[user.status]} />
      <Group y={r + 6}>
        <Rect x={-30} width={60} height={14} fill="#FFF" cornerRadius={7} shadowColor="rgba(0,0,0,0.08)" shadowBlur={3} shadowOffsetY={1} />
        <Text text={user.name.split(' ')[0]} x={-30} y={2} width={60} align="center" fontSize={9} fontStyle="500" fill="#374151" />
      </Group>
    </Group>
  );
}

// ── MAIN ─────────────────────────────────────────────────
export default function FloorCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const selRectRef = useRef<Konva.Rect>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const avatarImgsRef = useRef<Record<string, HTMLImageElement>>({});
  const [avatarsReady, setAvatarsReady] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeIds: string[] } | null>(null);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selStartRef = useRef<Point | null>(null);

  // Snap guides
  const [guides, setGuides] = useState<{ x?: number; y?: number }>({});

  const {
    floorPlan, users, currentUser, editorMode,
    setCamera, moveCurrentUser, selectFurniture, selectRoom,
    updateFurniture, updateRoom, removeRoom, removeFurniture,
  } = useOfficeStore();

  // Resize
  useEffect(() => {
    const resize = () => { if (containerRef.current) setSize({ w: containerRef.current.clientWidth, h: containerRef.current.clientHeight }); };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Load avatars
  const avatarKey = `${currentUser.avatarSeed}-${currentUser.avatarStyle}-${users.length}`;
  useEffect(() => {
    preloadAvatars([currentUser, ...users]).then(imgs => { avatarImgsRef.current = imgs; setAvatarsReady(true); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatarKey]);

  // Update Transformer when selection changes
  useEffect(() => {
    const tr = transformerRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;
    const nodes = selectedIds.map(id => stage.findOne('#' + id)).filter(Boolean) as Konva.Node[];
    tr.nodes(nodes);
    tr.getLayer()?.batchDraw();
  }, [selectedIds]);

  // Click on stage background
  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    setContextMenu(null);

    // Right click
    if (e.evt.button === 2) return;

    const clickedOnEmpty = e.target === e.target.getStage();

    if (clickedOnEmpty && editorMode === 'edit') {
      // Start selection rectangle
      setSelectedIds([]);
      const stage = stageRef.current!;
      const pos = stage.getRelativePointerPosition()!;
      selStartRef.current = pos;
      const selRect = selRectRef.current;
      if (selRect) {
        selRect.setAttrs({ x: pos.x, y: pos.y, width: 0, height: 0, visible: true });
        selRect.getLayer()?.batchDraw();
      }
      return;
    }

    if (clickedOnEmpty && editorMode !== 'edit') {
      // Move avatar in view mode
      const stage = stageRef.current!;
      const pos = stage.getRelativePointerPosition()!;
      moveCurrentUser(pos.x, pos.y);
      return;
    }
  };

  const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!selStartRef.current) return;
    const stage = stageRef.current!;
    const pos = stage.getRelativePointerPosition()!;
    const selRect = selRectRef.current;
    if (selRect) {
      const x = Math.min(selStartRef.current.x, pos.x);
      const y = Math.min(selStartRef.current.y, pos.y);
      selRect.setAttrs({ x, y, width: Math.abs(pos.x - selStartRef.current.x), height: Math.abs(pos.y - selStartRef.current.y) });
      selRect.getLayer()?.batchDraw();
    }
  };

  const handleStageMouseUp = () => {
    if (!selStartRef.current) return;
    selStartRef.current = null;
    const selRect = selRectRef.current;
    if (!selRect) return;

    const box = selRect.getClientRect();
    selRect.setAttrs({ visible: false });

    if (box.width < 5 && box.height < 5) return;

    // Find all shapes within selection
    const stage = stageRef.current!;
    const allShapes = stage.find('.selectable');
    const selected = allShapes.filter(shape => {
      const sbox = shape.getClientRect();
      return Konva.Util.haveIntersection(box, sbox);
    });
    setSelectedIds(selected.map(s => s.id()));
  };

  // Object click
  const handleSelect = (e: Konva.KonvaEventObject<MouseEvent>, id: string) => {
    e.cancelBubble = true;
    if (editorMode !== 'edit') return;

    if (e.evt.shiftKey) {
      // Shift click = toggle in selection
      setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    } else {
      setSelectedIds([id]);
    }
  };

  // Context menu
  const handleContextMenu = (e: Konva.KonvaEventObject<PointerEvent>) => {
    e.evt.preventDefault();
    if (editorMode !== 'edit') return;
    const stage = stageRef.current!;
    const pointer = stage.getPointerPosition()!;

    if (selectedIds.length > 0) {
      setContextMenu({ x: pointer.x, y: pointer.y, nodeIds: selectedIds });
    } else {
      // Find what's under cursor
      const target = e.target;
      const group = target.findAncestor('.selectable', true);
      if (group) {
        setContextMenu({ x: pointer.x, y: pointer.y, nodeIds: [group.id()] });
      }
    }
  };

  // Delete selected
  const handleDelete = () => {
    if (!contextMenu) return;
    contextMenu.nodeIds.forEach(id => {
      if (id.startsWith('room-')) removeRoom(id.replace('room-', ''));
      else if (id.startsWith('furn-')) removeFurniture(id.replace('furn-', ''));
    });
    setSelectedIds([]);
    setContextMenu(null);
  };

  // Drag with snap guides
  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const box = node.getClientRect();
    const stage = stageRef.current!;
    const allNodes = stage.find('.selectable').filter(n => n !== node && !selectedIds.includes(n.id()));

    let snapX: number | undefined;
    let snapY: number | undefined;

    allNodes.forEach(other => {
      const ob = other.getClientRect();
      // Left edge snap
      if (Math.abs(box.x - ob.x) < SNAP_THRESHOLD) snapX = ob.x;
      if (Math.abs(box.x - (ob.x + ob.width)) < SNAP_THRESHOLD) snapX = ob.x + ob.width;
      // Right edge snap
      if (Math.abs(box.x + box.width - ob.x) < SNAP_THRESHOLD) snapX = ob.x - box.width;
      if (Math.abs(box.x + box.width - (ob.x + ob.width)) < SNAP_THRESHOLD) snapX = ob.x + ob.width - box.width;
      // Top edge snap
      if (Math.abs(box.y - ob.y) < SNAP_THRESHOLD) snapY = ob.y;
      if (Math.abs(box.y - (ob.y + ob.height)) < SNAP_THRESHOLD) snapY = ob.y + ob.height;
      // Bottom edge snap
      if (Math.abs(box.y + box.height - ob.y) < SNAP_THRESHOLD) snapY = ob.y - box.height;
      if (Math.abs(box.y + box.height - (ob.y + ob.height)) < SNAP_THRESHOLD) snapY = ob.y + ob.height - box.height;
    });

    if (snapX !== undefined) node.x(snapX / stage.scaleX() - stage.x() / stage.scaleX());
    if (snapY !== undefined) node.y(snapY / stage.scaleY() - stage.y() / stage.scaleY());

    setGuides({ x: snapX, y: snapY });
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>, id: string, type: 'room' | 'furniture') => {
    setGuides({});
    const x = e.target.x(), y = e.target.y();
    const gs = floorPlan.gridSize;
    const snapped = { x: Math.round(x / gs) * gs, y: Math.round(y / gs) * gs };
    if (type === 'room') updateRoom(id, snapped);
    else updateFurniture(id, snapped);
  };

  // Wheel: pan + zoom
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current!;
    if (e.evt.ctrlKey || e.evt.metaKey) {
      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition()!;
      const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
      const newScale = Math.max(0.2, Math.min(3, oldScale * (e.evt.deltaY > 0 ? 0.92 : 1.08)));
      stage.scale({ x: newScale, y: newScale });
      stage.position({ x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale });
    } else {
      stage.position({ x: stage.x() - e.evt.deltaX, y: stage.y() - e.evt.deltaY });
    }
    stage.batchDraw();
  };

  // Fit all
  const fitAll = () => {
    const stage = stageRef.current;
    if (!stage || floorPlan.rooms.length === 0) return;
    const minX = Math.min(...floorPlan.rooms.map(r => r.x));
    const minY = Math.min(...floorPlan.rooms.map(r => r.y));
    const maxX = Math.max(...floorPlan.rooms.map(r => r.x + r.w));
    const maxY = Math.max(...floorPlan.rooms.map(r => r.y + r.h));
    const zoom = Math.min(1.2, (size.w - 60) / (maxX - minX + 80), (size.h - 60) / (maxY - minY + 80));
    stage.scale({ x: zoom, y: zoom });
    stage.position({ x: -(minX - 40) * zoom, y: -(minY - 40) * zoom });
    stage.batchDraw();
  };

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden" style={{ background: '#F5F5F5' }}>
      <Stage
        ref={stageRef}
        width={size.w} height={size.h}
        onWheel={handleWheel}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onContextMenu={handleContextMenu}
      >
        {/* Main layer */}
        <Layer>
          {/* Rooms */}
          {floorPlan.rooms.map(room => (
            <Group
              key={room.id} id={'room-' + room.id} name="selectable"
              x={room.x} y={room.y}
              draggable={editorMode === 'edit'}
              onClick={(e) => handleSelect(e, 'room-' + room.id)}
              onTap={(e) => handleSelect(e, 'room-' + room.id)}
              onDragMove={handleDragMove}
              onDragEnd={(e) => handleDragEnd(e, room.id, 'room')}
            >
              <Rect width={room.w} height={room.h} fill="#FFFFFF" cornerRadius={8}
                stroke={selectedIds.includes('room-' + room.id) ? '#6366F1' : '#E5E5E5'}
                strokeWidth={selectedIds.includes('room-' + room.id) ? 2 : 1}
                shadowColor="rgba(0,0,0,0.06)" shadowBlur={10} shadowOffsetY={2} />
              {liveRooms.has(room.id) && (
                <Group x={6} y={6}>
                  <Rect width={38} height={15} fill="#DC2626" cornerRadius={3} />
                  <Text text="LIVE" x={14} y={2} fontSize={7} fontStyle="bold" fill="#FFF" />
                </Group>
              )}
              <Group x={liveRooms.has(room.id) ? 48 : 6} y={6}>
                <Rect width={Math.max(60, room.name.length * 7 + 12)} height={15} fill="#F5F5F5" cornerRadius={4} />
                <Text text={room.name.toUpperCase()} x={5} y={2.5} fontSize={9} fontStyle="600" fill="#6B7280" />
              </Group>
            </Group>
          ))}

          {/* Furniture */}
          {floorPlan.furniture.map(f => (
            <Group
              key={f.id} id={'furn-' + f.id} name="selectable"
              x={f.x} y={f.y}
              draggable={editorMode === 'edit'}
              onClick={(e) => handleSelect(e, 'furn-' + f.id)}
              onTap={(e) => handleSelect(e, 'furn-' + f.id)}
              onDragMove={handleDragMove}
              onDragEnd={(e) => handleDragEnd(e, f.id, 'furniture')}
              rotation={f.rotation || 0}
            >
              <FurnitureInner f={f} />
            </Group>
          ))}

          {/* Transformer (selection handles) */}
          <Transformer
            ref={transformerRef}
            rotateEnabled={true}
            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
            borderStroke="#6366F1"
            borderStrokeWidth={1.5}
            anchorStroke="#6366F1"
            anchorFill="#FFFFFF"
            anchorSize={8}
            anchorCornerRadius={2}
          />

          {/* Selection rectangle */}
          <Rect ref={selRectRef} fill="rgba(99,102,241,0.08)" stroke="rgba(99,102,241,0.4)" strokeWidth={1} dash={[4, 3]} visible={false} />

          {/* Snap guides */}
          {guides.x !== undefined && <Line points={[guides.x, -10000, guides.x, 10000]} stroke="#6366F1" strokeWidth={0.5} dash={[4, 4]} listening={false} />}
          {guides.y !== undefined && <Line points={[-10000, guides.y, 10000, guides.y]} stroke="#6366F1" strokeWidth={0.5} dash={[4, 4]} listening={false} />}
        </Layer>

        {/* Avatars (separate layer, non-interactive in edit mode) */}
        <Layer listening={editorMode !== 'edit'}>
          {users.map(u => <AvatarShape key={u.id} user={u} isCurrent={false} avatarImg={avatarImgsRef.current[u.name]} />)}
          <AvatarShape user={currentUser} isCurrent={true} avatarImg={avatarImgsRef.current[currentUser.name]} />
        </Layer>
      </Stage>

      {/* Context menu */}
      {contextMenu && <div className="absolute inset-0 z-10" onClick={() => setContextMenu(null)} />}
      {contextMenu && (
        <div className="absolute bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[150px] z-20"
          style={{ left: contextMenu.x, top: contextMenu.y }}>
          <div className="px-3 py-1 text-[10px] text-gray-400 border-b border-gray-100">
            {contextMenu.nodeIds.length > 1 ? `${contextMenu.nodeIds.length}個選択中` : contextMenu.nodeIds[0]}
          </div>
          <button onClick={handleDelete} className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50">🗑 削除</button>
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-200/50 overflow-hidden z-20">
        <button onClick={() => { const s = stageRef.current; if (s) { s.scale({ x: s.scaleX() * 1.2, y: s.scaleY() * 1.2 }); s.batchDraw(); } }}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-500 text-sm">+</button>
        <button onClick={() => { const s = stageRef.current; if (s) { s.scale({ x: s.scaleX() / 1.2, y: s.scaleY() / 1.2 }); s.batchDraw(); } }}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-500 text-sm">−</button>
        <button onClick={fitAll} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-500 text-[10px] border-t border-gray-100" title="全体表示">⊡</button>
      </div>
    </div>
  );
}
