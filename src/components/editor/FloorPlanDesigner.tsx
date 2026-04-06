'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import {
  generateFloorPlanSVG, svgToDataURL,
  FLOOR_PLAN_PRESETS, PRESET_CATEGORIES,
  ROOM_TYPE_NAMES,
} from '@/lib/floorPlanGenerator';
import type { FloorPlanConfig, FloorRoomType, RoomDef } from '@/lib/floorPlanGenerator';
import { ROOM_DEFAULTS } from '@/lib/floorPlanGenerator';
import { createBackgroundElement, BG_ELEMENT_ID } from '@/lib/backgroundAssets';
import { convertToExcalidrawElements } from '@excalidraw/excalidraw';
import { Building2, Palette, ChevronRight, X, DoorOpen, Eraser } from 'lucide-react';

type Tab = 'presets' | 'customize';
type PresetCategory = 'all' | 'startup' | 'corporate' | 'education' | 'creative' | 'coworking' | 'minimal';

// ── Room type palette ──
const ROOM_PALETTE: { type: FloorRoomType; icon: string; label: string; defaultW: number; defaultH: number }[] = [
  { type: 'workspace',  icon: '💻', label: 'ワーク',     defaultW: 400, defaultH: 300 },
  { type: 'meeting',    icon: '🤝', label: '会議室',     defaultW: 300, defaultH: 250 },
  { type: 'cafe',       icon: '☕', label: 'カフェ',     defaultW: 300, defaultH: 250 },
  { type: 'executive',  icon: '👔', label: '役員室',     defaultW: 300, defaultH: 250 },
  { type: 'break-room', icon: '🍵', label: '休憩室',     defaultW: 250, defaultH: 200 },
  { type: 'reception',  icon: '🏢', label: '受付',       defaultW: 350, defaultH: 200 },
  { type: 'open-area',  icon: '🌐', label: 'オープン',   defaultW: 500, defaultH: 400 },
];

// Room type → fill color for the interactive canvas
const ROOM_COLORS: Record<FloorRoomType, { bg: string; border: string }> = {
  'workspace':  { bg: '#f5f0e8', border: '#d4c9b5' },
  'meeting':    { bg: '#e8edf5', border: '#b5c1d4' },
  'executive':  { bg: '#e8e0d4', border: '#c9b8a0' },
  'open-area':  { bg: '#f0ede8', border: '#ccc8c0' },
  'break-room': { bg: '#e8f5e8', border: '#b0d4b0' },
  'reception':  { bg: '#f5f0ed', border: '#d4c9c0' },
  'cafe':       { bg: '#f5ede0', border: '#d4c0a0' },
};

// Floor color presets for user selection
const FLOOR_COLOR_OPTIONS = [
  { color: '#f5f0e8', label: 'ナチュラル' },
  { color: '#faf7f2', label: 'ホワイト' },
  { color: '#f0ebe3', label: 'ベージュ' },
  { color: '#e8edf5', label: 'ブルー' },
  { color: '#e8f5e8', label: 'グリーン' },
  { color: '#f5e8e8', label: 'ピンク' },
  { color: '#f0ede8', label: 'グレー' },
  { color: '#f5ede0', label: 'ウォーム' },
  { color: '#e8e0d4', label: 'ダーク' },
];

// Floor size presets
const SIZE_PRESETS = [
  { label: 'S', w: 800,  h: 500,  desc: '小 (1-3人)' },
  { label: 'M', w: 1200, h: 640,  desc: '中 (4-10人)' },
  { label: 'L', w: 1600, h: 800,  desc: '大 (10-20人)' },
  { label: 'XL', w: 2000, h: 1000, desc: '特大 (20人+)' },
];

function makeDefaultConfig(): FloorPlanConfig {
  return {
    width: 1200, height: 640,
    style: 'modern', backgroundColor: '#faf7f2',
    exteriorWallThickness: 8, interiorWallThickness: 6,
    rooms: [], decorations: [],
  };
}

export default function FloorPlanDesigner({ onClose }: { onClose: () => void }) {
  const excalidrawAPI = useOfficeStore((s) => s.excalidrawAPI);
  const [tab, setTab] = useState<Tab>('presets');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [category, setCategory] = useState<PresetCategory>('all');
  const [applying, setApplying] = useState(false);
  const [customConfig, setCustomConfig] = useState<FloorPlanConfig | null>(null);

  const filtered = useMemo(() => {
    return FLOOR_PLAN_PRESETS.filter(p => category === 'all' || p.category === category);
  }, [category]);

  const selectedPreset = useMemo(() => FLOOR_PLAN_PRESETS.find(p => p.id === selectedId) || null, [selectedId]);
  const activeConfig = customConfig || selectedPreset?.config || null;

  const handleApply = useCallback(async () => {
    if (!excalidrawAPI || !activeConfig) return;
    setApplying(true);
    try {
      // Add auto decorations (corner plants)
      const pad = activeConfig.exteriorWallThickness;
      const configWithDeco = {
        ...activeConfig,
        decorations: [
          { type: 'plant' as const, x: pad + 15, y: pad + 15 },
          { type: 'plant' as const, x: activeConfig.width - pad - 15, y: pad + 15 },
          { type: 'plant' as const, x: pad + 15, y: activeConfig.height - pad - 15 },
          { type: 'plant' as const, x: activeConfig.width - pad - 15, y: activeConfig.height - pad - 15 },
        ],
      };

      const svg = generateFloorPlanSVG(configWithDeco);
      const dataURL = svgToDataURL(svg);
      const bgId = `bg-gen-${Date.now()}`;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      excalidrawAPI.addFiles([{ id: bgId, dataURL, mimeType: 'image/svg+xml', created: Date.now() } as any]);

      const existing = excalidrawAPI.getSceneElements();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const withoutBg = existing.filter((el: any) =>
        el.id !== BG_ELEMENT_ID && !(el.type === 'image' && el.fileId?.startsWith('bg-') && el.locked)
      );

      const bgRaw = createBackgroundElement({
        id: bgId, name: 'カスタムフロア', src: '',
        width: configWithDeco.width, height: configWithDeco.height, category: 'office', proOnly: false,
      });
      bgRaw.fileId = bgId;

      const converted = convertToExcalidrawElements([bgRaw] as Parameters<typeof convertToExcalidrawElements>[0]);
      excalidrawAPI.updateScene({ elements: [...converted, ...withoutBg] });
      onClose();
    } catch (e) {
      console.error('Failed to apply floor plan:', e);
    } finally {
      setApplying(false);
    }
  }, [excalidrawAPI, activeConfig, onClose]);

  const handleCustomize = () => {
    if (selectedPreset) {
      setCustomConfig(JSON.parse(JSON.stringify(selectedPreset.config)));
    } else {
      setCustomConfig(makeDefaultConfig());
    }
    setTab('customize');
  };

  const categories = Object.entries(PRESET_CATEGORIES);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-5xl mx-4 max-h-[90vh] overflow-hidden animate-float-in border border-zinc-200 dark:border-zinc-700">
        {/* Header */}
        <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">フロアプラン</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
              <button onClick={() => setTab('presets')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${tab === 'presets' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500'}`}>
                テンプレート
              </button>
              <button onClick={handleCustomize}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${tab === 'customize' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500'}`}>
                自由に作る
              </button>
            </div>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">&times;</button>
          </div>
        </div>

        {tab === 'presets' ? (
          <>
            <div className="px-5 py-2 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex gap-1.5 overflow-x-auto">
                <button onClick={() => setCategory('all')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${category === 'all' ? 'bg-accent text-zinc-950' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                  すべて
                </button>
                {categories.map(([key, label]) => (
                  <button key={key} onClick={() => setCategory(key as PresetCategory)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${category === key ? 'bg-accent text-zinc-950' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex" style={{ height: 420 }}>
              <div className="w-1/2 p-4 overflow-y-auto border-r border-zinc-100 dark:border-zinc-800">
                <div className="grid grid-cols-2 gap-3">
                  {filtered.map(preset => (
                    <button key={preset.id} onClick={() => { setSelectedId(preset.id); setCustomConfig(null); }}
                      className={`rounded-xl overflow-hidden border-2 text-left transition-all ${selectedId === preset.id ? 'border-amber-500 ring-1 ring-amber-500/30' : 'border-zinc-200 dark:border-zinc-700 hover:border-amber-400'}`}>
                      <div className="aspect-video bg-zinc-50 dark:bg-zinc-800">
                        <img src={svgToDataURL(generateFloorPlanSVG(preset.config))} alt={preset.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="px-3 py-2">
                        <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">{preset.name}</div>
                        <div className="text-[10px] text-zinc-500 truncate">{preset.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="w-1/2 p-4 flex flex-col">
                {selectedPreset ? (
                  <>
                    <div className="flex-1 bg-zinc-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center p-4">
                      <img src={svgToDataURL(generateFloorPlanSVG(selectedPreset.config))} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg shadow-md" />
                    </div>
                    <div className="mt-3">
                      <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{selectedPreset.name}</h3>
                      <p className="text-xs text-zinc-500">{selectedPreset.description}</p>
                      <button onClick={handleCustomize} className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5 mt-1">
                        <Palette className="w-3 h-3" /> これをベースにカスタマイズ <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm">
                    <div className="text-center">
                      <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p>テンプレートを選択</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <MadoriEditor
            config={customConfig || makeDefaultConfig()}
            onChange={setCustomConfig}
          />
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-500">キャンセル</button>
          <button onClick={handleApply} disabled={!activeConfig || applying}
            className="px-5 py-2 bg-accent hover:bg-accent-hover text-zinc-950 font-semibold text-sm rounded-xl disabled:opacity-50">
            {applying ? '適用中...' : '適用する'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MadoriEditor — 間取りアプリ風ビジュアルエディタ
// 左: パーツパレット  中央: キャンバス(部屋ブロックをドラッグ配置)
// ══════════════════════════════════════════════════════════════

type WallTool = 'none' | 'eraser' | 'door';

function MadoriEditor({ config, onChange }: { config: FloorPlanConfig; onChange: (c: FloorPlanConfig) => void }) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [wallTool, setWallTool] = useState<WallTool>('none');
  const [dragState, setDragState] = useState<{
    roomIdx: number; startMX: number; startMY: number; origX: number; origY: number;
  } | null>(null);
  const [resizeState, setResizeState] = useState<{
    roomIdx: number; handle: string; startMX: number; startMY: number; orig: RoomDef;
  } | null>(null);

  // Canvas dimensions and scale
  const canvasW = 680;
  const canvasH = 460;
  const scale = Math.min((canvasW - 20) / config.width, (canvasH - 20) / config.height);
  const padX = (canvasW - config.width * scale) / 2;
  const padY = (canvasH - config.height * scale) / 2;

  const GRID = 20; // snap grid in floor coordinates
  const snap = (v: number) => Math.round(v / GRID) * GRID;

  // ── Add room at first available position ──
  const addRoom = (type: FloorRoomType) => {
    const palette = ROOM_PALETTE.find(p => p.type === type)!;
    const pad = config.exteriorWallThickness;
    const name = ROOM_TYPE_NAMES[type];
    const existing = config.rooms.filter(r => r.type === type).length;
    const label = existing > 0 ? `${name}${existing + 1}` : name;

    // Find a free spot (simple: stack from top-left, next open area)
    let x = pad, y = pad;
    const w = Math.min(palette.defaultW, config.width - pad * 2);
    const h = Math.min(palette.defaultH, config.height - pad * 2);

    // Try to find non-overlapping position
    const occupied = config.rooms;
    for (let tryY = pad; tryY + h <= config.height - pad; tryY += GRID) {
      for (let tryX = pad; tryX + w <= config.width - pad; tryX += GRID) {
        const overlaps = occupied.some(r =>
          tryX < r.x + r.width && tryX + w > r.x && tryY < r.y + r.height && tryY + h > r.y
        );
        if (!overlaps) { x = tryX; y = tryY; tryY = config.height; break; }
      }
    }

    const newRoom: RoomDef = {
      id: `r${Date.now()}`, type, name: label,
      x, y, width: w, height: h,
      doors: [], windows: [],
    };

    // Auto windows on top edge
    if (y <= pad + 2 && w > 200) {
      newRoom.windows = [{ wall: 0 as const, position: 0.3 }, { wall: 0 as const, position: 0.7 }];
    } else if (y <= pad + 2) {
      newRoom.windows = [{ wall: 0 as const, position: 0.5 }];
    }

    onChange({ ...config, rooms: [...config.rooms, newRoom] });
    setSelectedRoom(config.rooms.length);
  };

  const removeRoom = (idx: number) => {
    onChange({ ...config, rooms: config.rooms.filter((_, i) => i !== idx) });
    setSelectedRoom(null);
  };

  const setFloorSize = (w: number, h: number) => {
    // Clamp rooms that would be out of bounds
    const pad = config.exteriorWallThickness;
    const rooms = config.rooms.map(r => ({
      ...r,
      x: Math.min(r.x, w - pad - 120),
      y: Math.min(r.y, h - pad - 120),
      width: Math.min(r.width, w - pad - r.x),
      height: Math.min(r.height, h - pad - r.y),
    }));
    onChange({ ...config, width: w, height: h, rooms });
  };

  // ── Wall click: position-aware opening/door placement ──
  const handleWallClick = (e: React.MouseEvent, roomIdx: number, wallIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    const rooms = [...config.rooms];
    const room = { ...rooms[roomIdx] };

    // Calculate click position along the wall (0-1)
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const isHorizontal = wallIdx === 0 || wallIdx === 2;
    const clickFraction = isHorizontal
      ? (e.clientX - rect.left) / rect.width
      : (e.clientY - rect.top) / rect.height;
    const position = Math.max(0.1, Math.min(0.9, clickFraction));

    if (wallTool === 'eraser') {
      // Add/remove opening at click position
      const openings = room.openings ? [...room.openings] : [];
      // Check if there's already an opening near this position
      const nearIdx = openings.findIndex(o => o.wall === wallIdx && Math.abs(o.position - position) < 0.15);
      if (nearIdx >= 0) {
        openings.splice(nearIdx, 1); // Remove existing opening
      } else {
        openings.push({ wall: wallIdx as 0|1|2|3, position, width: 80 });
      }
      room.openings = openings;
    } else if (wallTool === 'door') {
      // Add/remove door at click position (multiple per wall OK)
      const doors = room.doors ? [...room.doors] : [];
      const nearIdx = doors.findIndex(d => d.wall === wallIdx && Math.abs(d.position - position) < 0.1);
      if (nearIdx >= 0) {
        doors.splice(nearIdx, 1); // Remove existing door
      } else {
        doors.push({ wall: wallIdx as 0|1|2|3, position, width: 60 });
      }
      room.doors = doors;
    }

    rooms[roomIdx] = room;
    onChange({ ...config, rooms });
  };

  // ── Mouse handlers ──
  const getCanvasPos = (e: React.MouseEvent | MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleRoomMouseDown = (e: React.MouseEvent, idx: number) => {
    // Don't start drag when wall tool is active — let wall clicks through
    if (wallTool !== 'none') return;
    e.preventDefault();
    e.stopPropagation();
    const pos = getCanvasPos(e);
    const room = config.rooms[idx];
    setDragState({ roomIdx: idx, startMX: pos.x, startMY: pos.y, origX: room.x, origY: room.y });
    setSelectedRoom(idx);
  };

  const handleHandleMouseDown = (e: React.MouseEvent, idx: number, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = getCanvasPos(e);
    setResizeState({ roomIdx: idx, handle, startMX: pos.x, startMY: pos.y, orig: { ...config.rooms[idx] } });
  };

  useEffect(() => {
    if (!dragState && !resizeState) return;
    const pad = config.exteriorWallThickness;
    const MIN = 100;

    const onMove = (e: MouseEvent) => {
      const pos = getCanvasPos(e);

      if (dragState) {
        const dx = (pos.x - dragState.startMX) / scale;
        const dy = (pos.y - dragState.startMY) / scale;
        const room = config.rooms[dragState.roomIdx];
        const newX = snap(Math.max(pad, Math.min(config.width - pad - room.width, dragState.origX + dx)));
        const newY = snap(Math.max(pad, Math.min(config.height - pad - room.height, dragState.origY + dy)));
        const rooms = [...config.rooms];
        rooms[dragState.roomIdx] = { ...room, x: newX, y: newY };
        onChange({ ...config, rooms });
      }

      if (resizeState) {
        const dx = (pos.x - resizeState.startMX) / scale;
        const dy = (pos.y - resizeState.startMY) / scale;
        const o = resizeState.orig;
        let { x, y, width, height } = o;
        const h = resizeState.handle;

        if (h.includes('e')) width = snap(Math.max(MIN, Math.min(config.width - pad - x, o.width + dx)));
        if (h.includes('s')) height = snap(Math.max(MIN, Math.min(config.height - pad - y, o.height + dy)));
        if (h.includes('w')) {
          const nx = snap(Math.max(pad, o.x + dx));
          const nw = o.width + (o.x - nx);
          if (nw >= MIN) { x = nx; width = nw; }
        }
        if (h.includes('n')) {
          const ny = snap(Math.max(pad, o.y + dy));
          const nh = o.height + (o.y - ny);
          if (nh >= MIN) { y = ny; height = nh; }
        }

        const rooms = [...config.rooms];
        rooms[resizeState.roomIdx] = { ...rooms[resizeState.roomIdx], x, y, width, height };
        onChange({ ...config, rooms });
      }
    };

    const onUp = () => { setDragState(null); setResizeState(null); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragState, resizeState]);

  return (
    <div className="flex" style={{ height: 500 }}>
      {/* ── Left: Parts Palette ── */}
      <div className="w-[200px] border-r border-zinc-200 dark:border-zinc-700 flex flex-col">
        {/* Floor size */}
        <div className="p-3 border-b border-zinc-100 dark:border-zinc-800">
          <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">フロアサイズ</label>
          <div className="grid grid-cols-4 gap-1">
            {SIZE_PRESETS.map(sp => {
              const active = config.width === sp.w && config.height === sp.h;
              return (
                <button key={sp.label} onClick={() => setFloorSize(sp.w, sp.h)}
                  className={`py-1.5 rounded-md text-[11px] font-bold transition-all ${active ? 'bg-accent text-zinc-950' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}>
                  {sp.label}
                </button>
              );
            })}
          </div>
          <p className="text-[9px] text-zinc-400 mt-1 text-center">{config.width}×{config.height}</p>
        </div>

        {/* Room palette */}
        <div className="p-3 border-b border-zinc-100 dark:border-zinc-800">
          <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">パーツを追加</label>
          <div className="space-y-1">
            {ROOM_PALETTE.map(p => (
              <button key={p.type} onClick={() => addRoom(p.type)}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-left group">
                <span className="w-6 h-6 rounded flex items-center justify-center text-sm" style={{ background: ROOM_COLORS[p.type].bg, border: `1px solid ${ROOM_COLORS[p.type].border}` }}>
                  {p.icon}
                </span>
                <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 flex-1">{p.label}</span>
                <span className="text-zinc-300 dark:text-zinc-600 group-hover:text-amber-500 text-lg">+</span>
              </button>
            ))}
          </div>
        </div>

        {/* Wall tools */}
        <div className="p-3 border-b border-zinc-100 dark:border-zinc-800">
          <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">壁ツール</label>
          <div className="grid grid-cols-2 gap-1">
            <button onClick={() => setWallTool(wallTool === 'eraser' ? 'none' : 'eraser')}
              className={`flex items-center gap-1.5 px-2 py-2 rounded-lg border text-[11px] font-medium transition-all ${
                wallTool === 'eraser'
                  ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                  : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
              }`}>
              <Eraser className="w-3.5 h-3.5" />
              壁を消す
            </button>
            <button onClick={() => setWallTool(wallTool === 'door' ? 'none' : 'door')}
              className={`flex items-center gap-1.5 px-2 py-2 rounded-lg border text-[11px] font-medium transition-all ${
                wallTool === 'door'
                  ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                  : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
              }`}>
              <DoorOpen className="w-3.5 h-3.5" />
              ドア
            </button>
          </div>
          {wallTool !== 'none' && (
            <p className="text-[9px] text-zinc-500 mt-1.5">
              {wallTool === 'eraser' ? '辺をクリックで開口追加。下で位置・幅を調整' : '辺をクリックでドア追加。下で位置を調整'}
            </p>
          )}
        </div>

        {/* Opening/Door detail editor — per selected room */}
        {selectedRoom !== null && config.rooms[selectedRoom] && (
          <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 max-h-[160px] overflow-y-auto">
            {(() => {
              const room = config.rooms[selectedRoom];
              const wallNames = ['上', '右', '下', '左'];
              const hasOpenings = (room.openings?.length || 0) > 0;
              const hasDoors = (room.doors?.length || 0) > 0;
              if (!hasOpenings && !hasDoors) return <p className="text-[9px] text-zinc-400">開口・ドアなし</p>;
              return (
                <>
                  {room.openings?.map((op, oi) => (
                    <div key={`o${oi}`} className="mb-2 p-2 bg-red-50 dark:bg-red-900/10 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-red-600 dark:text-red-400">開口 ({wallNames[op.wall]}壁)</span>
                        <button onClick={() => {
                          const rooms = [...config.rooms];
                          const r = { ...rooms[selectedRoom] };
                          r.openings = r.openings!.filter((_, j) => j !== oi);
                          rooms[selectedRoom] = r;
                          onChange({ ...config, rooms });
                        }} className="text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 flex items-center gap-1">位置
                          <input type="range" min="0.05" max="0.95" step="0.05" value={op.position}
                            onChange={e => {
                              const rooms = [...config.rooms];
                              const r = { ...rooms[selectedRoom] };
                              r.openings = [...r.openings!];
                              r.openings[oi] = { ...r.openings[oi], position: parseFloat(e.target.value) };
                              rooms[selectedRoom] = r;
                              onChange({ ...config, rooms });
                            }} className="flex-1 h-1 accent-red-500" />
                          <span className="text-[9px] w-6 text-right">{Math.round(op.position * 100)}%</span>
                        </label>
                        <label className="text-[9px] text-zinc-500 flex items-center gap-1">幅
                          <input type="range" min="40" max="200" step="10" value={op.width || 80}
                            onChange={e => {
                              const rooms = [...config.rooms];
                              const r = { ...rooms[selectedRoom] };
                              r.openings = [...r.openings!];
                              r.openings[oi] = { ...r.openings[oi], width: parseInt(e.target.value) };
                              rooms[selectedRoom] = r;
                              onChange({ ...config, rooms });
                            }} className="flex-1 h-1 accent-red-500" />
                          <span className="text-[9px] w-8 text-right">{op.width || 80}px</span>
                        </label>
                      </div>
                    </div>
                  ))}
                  {room.doors?.map((d, di) => (
                    <div key={`d${di}`} className="mb-2 p-2 bg-amber-50 dark:bg-amber-900/10 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">ドア ({wallNames[d.wall]}壁)</span>
                        <button onClick={() => {
                          const rooms = [...config.rooms];
                          const r = { ...rooms[selectedRoom] };
                          r.doors = r.doors.filter((_, j) => j !== di);
                          rooms[selectedRoom] = r;
                          onChange({ ...config, rooms });
                        }} className="text-amber-400 hover:text-amber-600"><X className="w-3 h-3" /></button>
                      </div>
                      <label className="text-[9px] text-zinc-500 flex items-center gap-1">位置
                        <input type="range" min="0.1" max="0.9" step="0.05" value={d.position}
                          onChange={e => {
                            const rooms = [...config.rooms];
                            const r = { ...rooms[selectedRoom] };
                            r.doors = [...r.doors];
                            r.doors[di] = { ...r.doors[di], position: parseFloat(e.target.value) };
                            rooms[selectedRoom] = r;
                            onChange({ ...config, rooms });
                          }} className="flex-1 h-1 accent-amber-500" />
                        <span className="text-[9px] w-6 text-right">{Math.round(d.position * 100)}%</span>
                      </label>
                    </div>
                  ))}
                </>
              );
            })()}
          </div>
        )}

        {/* Room list */}
        <div className="flex-1 overflow-y-auto p-3">
          <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">配置中 ({config.rooms.length})</label>
          <div className="space-y-1">
            {config.rooms.map((room, i) => {
              const pal = ROOM_PALETTE.find(p => p.type === room.type);
              const currentColor = room.floorColor || ROOM_DEFAULTS[room.type]?.color || '#f5f0e8';
              return (
                <div key={room.id}
                  onClick={() => setSelectedRoom(i)}
                  className={`rounded-lg cursor-pointer transition-all text-[11px] ${
                    selectedRoom === i ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-transparent'
                  }`}>
                  <div className="flex items-center gap-1.5 px-2 py-1.5">
                    <span>{pal?.icon}</span>
                    <span className="flex-1 font-medium text-zinc-700 dark:text-zinc-300 truncate">{room.name}</span>
                    <button onClick={e => { e.stopPropagation(); removeRoom(i); }}
                      className="text-zinc-300 hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  {/* Floor color picker — visible when selected */}
                  {selectedRoom === i && (
                    <div className="px-2 pb-2 flex gap-1 flex-wrap" onClick={e => e.stopPropagation()}>
                      {FLOOR_COLOR_OPTIONS.map(fc => (
                        <button key={fc.color}
                          onClick={() => {
                            const rooms = [...config.rooms];
                            rooms[i] = { ...rooms[i], floorColor: fc.color };
                            onChange({ ...config, rooms });
                          }}
                          title={fc.label}
                          className={`w-5 h-5 rounded-full border-2 transition-all ${currentColor === fc.color ? 'border-amber-500 scale-110' : 'border-zinc-300 dark:border-zinc-600 hover:border-amber-400'}`}
                          style={{ background: fc.color }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Center: Interactive Canvas ── */}
      <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center p-3">
        <div
          ref={canvasRef}
          className="relative rounded-lg overflow-hidden shadow-inner"
          style={{
            width: canvasW, height: canvasH,
            background: `
              linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px),
              #fafaf8`,
            backgroundSize: `${GRID * scale}px ${GRID * scale}px`,
            backgroundPosition: `${padX}px ${padY}px`,
          }}
          onClick={() => setSelectedRoom(null)}
        >
          {/* Floor outline */}
          <div className="absolute pointer-events-none" style={{
            left: padX, top: padY,
            width: config.width * scale, height: config.height * scale,
            border: '3px solid #8b7355', borderRadius: 4,
            boxShadow: 'inset 0 0 0 1px rgba(139,115,85,0.2)',
          }} />

          {/* Room blocks — colored, draggable, labeled */}
          {config.rooms.map((room, i) => {
            const rx = padX + room.x * scale;
            const ry = padY + room.y * scale;
            const rw = room.width * scale;
            const rh = room.height * scale;
            const roomColor = room.floorColor || ROOM_DEFAULTS[room.type]?.color || '#f5f0e8';
            const colors = { bg: roomColor, border: ROOM_COLORS[room.type].border };
            const isSelected = selectedRoom === i;
            const isDragging = dragState?.roomIdx === i;
            const pal = ROOM_PALETTE.find(p => p.type === room.type);

            return (
              <div key={room.id}
                className={`absolute select-none ${isDragging ? 'cursor-grabbing z-20' : 'cursor-grab z-10'}`}
                style={{
                  left: rx, top: ry, width: rw, height: rh,
                  background: colors.bg,
                  border: isSelected ? '2px solid #f59e0b' : `1.5px solid ${colors.border}`,
                  borderRadius: 3,
                  boxShadow: isSelected ? '0 0 0 2px rgba(245,158,11,0.2)' : isDragging ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                  transition: isDragging ? 'none' : 'box-shadow 0.15s',
                }}
                onMouseDown={e => handleRoomMouseDown(e, i)}
                onClick={e => { e.stopPropagation(); setSelectedRoom(i); }}
              >
                {/* Room label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  {rw > 60 && rh > 40 && <span className="text-sm mb-0.5">{pal?.icon}</span>}
                  {rw > 50 && rh > 30 && (
                    <span className="text-[10px] font-bold text-zinc-600/70 truncate max-w-[90%]">{room.name}</span>
                  )}
                </div>

                {/* Wall click zones — shown when wall tool is active */}
                {wallTool !== 'none' && (
                  <>
                    {[0, 1, 2, 3].map(wallIdx => {
                      const isH = wallIdx === 0 || wallIdx === 2;
                      const hasOpening = room.openings?.some(o => o.wall === wallIdx);
                      const hasDoor = room.doors?.some(d => d.wall === wallIdx);
                      const posStyle: React.CSSProperties = isH
                        ? { top: wallIdx === 0 ? 0 : undefined, bottom: wallIdx === 2 ? 0 : undefined, left: 10, right: 10, height: 10, transform: wallIdx === 0 ? 'translateY(-50%)' : 'translateY(50%)' }
                        : { left: wallIdx === 3 ? 0 : undefined, right: wallIdx === 1 ? 0 : undefined, top: 10, bottom: 10, width: 10, transform: wallIdx === 3 ? 'translateX(-50%)' : 'translateX(50%)' };
                      return (
                        <div key={wallIdx}
                          className={`absolute z-30 rounded cursor-pointer transition-all ${
                            hasOpening ? 'bg-red-400/30 border border-dashed border-red-400' :
                            hasDoor ? 'bg-amber-400/30 border border-amber-400' :
                            wallTool === 'eraser' ? 'hover:bg-red-400/20' : 'hover:bg-amber-400/20'
                          }`}
                          style={posStyle}
                          onClick={e => handleWallClick(e, i, wallIdx)}
                          title={['上の壁', '右の壁', '下の壁', '左の壁'][wallIdx]}
                        />
                      );
                    })}
                  </>
                )}

                {/* Wall status indicators — always show openings and doors (when tool is off) */}
                {wallTool === 'none' && (
                  <>
                    {room.openings?.map((op, oi) => {
                      const isH = op.wall === 0 || op.wall === 2;
                      const pct = `${(op.position - 0.05) * 100}%`;
                      const style: React.CSSProperties = isH
                        ? { left: pct, width: '10%', height: 3, top: op.wall === 0 ? -1 : undefined, bottom: op.wall === 2 ? -1 : undefined }
                        : { top: pct, height: '10%', width: 3, left: op.wall === 3 ? -1 : undefined, right: op.wall === 1 ? -1 : undefined };
                      return <div key={`o${oi}`} className="absolute border border-dashed border-red-400 pointer-events-none z-20" style={style} />;
                    })}
                    {room.doors?.map((d, di) => {
                      const isH = d.wall === 0 || d.wall === 2;
                      const pct = `${(d.position - 0.04) * 100}%`;
                      const style: React.CSSProperties = isH
                        ? { left: pct, width: '8%', height: 4, top: d.wall === 0 ? -2 : undefined, bottom: d.wall === 2 ? -2 : undefined }
                        : { top: pct, height: '8%', width: 4, left: d.wall === 3 ? -2 : undefined, right: d.wall === 1 ? -2 : undefined };
                      return <div key={`d${di}`} className="absolute bg-amber-500 rounded-sm pointer-events-none z-20" style={style} />;
                    })}
                  </>
                )}

                {/* Resize handles — only when selected and no wall tool */}
                {isSelected && wallTool === 'none' && (
                  <>
                    {/* Corners */}
                    <div className="absolute -right-[5px] -bottom-[5px] w-[10px] h-[10px] bg-amber-500 rounded-sm cursor-se-resize z-30"
                      onMouseDown={e => handleHandleMouseDown(e, i, 'se')} />
                    <div className="absolute -left-[5px] -bottom-[5px] w-[10px] h-[10px] bg-amber-500 rounded-sm cursor-sw-resize z-30"
                      onMouseDown={e => handleHandleMouseDown(e, i, 'sw')} />
                    <div className="absolute -right-[5px] -top-[5px] w-[10px] h-[10px] bg-amber-500 rounded-sm cursor-ne-resize z-30"
                      onMouseDown={e => handleHandleMouseDown(e, i, 'ne')} />
                    <div className="absolute -left-[5px] -top-[5px] w-[10px] h-[10px] bg-amber-500 rounded-sm cursor-nw-resize z-30"
                      onMouseDown={e => handleHandleMouseDown(e, i, 'nw')} />
                    {/* Edges */}
                    {rw > 60 && <div className="absolute -right-[4px] top-1/2 -translate-y-1/2 w-[8px] h-[20px] bg-amber-400 rounded-sm cursor-e-resize z-30"
                      onMouseDown={e => handleHandleMouseDown(e, i, 'e')} />}
                    {rw > 60 && <div className="absolute -left-[4px] top-1/2 -translate-y-1/2 w-[8px] h-[20px] bg-amber-400 rounded-sm cursor-w-resize z-30"
                      onMouseDown={e => handleHandleMouseDown(e, i, 'w')} />}
                    {rh > 40 && <div className="absolute left-1/2 -translate-x-1/2 -bottom-[4px] h-[8px] w-[20px] bg-amber-400 rounded-sm cursor-s-resize z-30"
                      onMouseDown={e => handleHandleMouseDown(e, i, 's')} />}
                    {rh > 40 && <div className="absolute left-1/2 -translate-x-1/2 -top-[4px] h-[8px] w-[20px] bg-amber-400 rounded-sm cursor-n-resize z-30"
                      onMouseDown={e => handleHandleMouseDown(e, i, 'n')} />}
                    {/* Delete button */}
                    <button
                      className="absolute -top-3 -right-3 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] z-30 shadow"
                      onMouseDown={e => { e.stopPropagation(); removeRoom(i); }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            );
          })}

          {/* Empty state */}
          {config.rooms.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-sm text-zinc-400 dark:text-zinc-500 mb-1">←左のパーツをクリックして</p>
                <p className="text-sm text-zinc-400 dark:text-zinc-500">部屋を配置しましょう</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
