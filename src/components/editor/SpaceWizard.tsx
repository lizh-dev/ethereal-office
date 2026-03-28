'use client';

import { useState } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import { Room, Furniture, RoomType } from '@/types';

interface SpaceConfig {
  type: 'desk-area' | 'meeting' | 'lounge' | 'cafe';
  name: string;
  rows: number;
  cols: number;
  spacing: number;
  direction: 'horizontal' | 'vertical';
}

const SPACE_TYPES = [
  { id: 'desk-area' as const, label: 'デスクエリア', desc: 'デスク+椅子+モニター', icon: '🖥', roomType: 'workspace' as RoomType },
  { id: 'meeting' as const, label: '会議室', desc: 'テーブル+椅子', icon: '🤝', roomType: 'meeting' as RoomType },
  { id: 'lounge' as const, label: 'ラウンジ', desc: 'ソファ+テーブル+植物', icon: '🛋', roomType: 'lounge' as RoomType },
  { id: 'cafe' as const, label: 'カフェスペース', desc: 'テーブル+椅子+コーヒー', icon: '☕', roomType: 'cafe' as RoomType },
];

const DESK_W = 75, DESK_H = 35, CHAIR_S = 20, MONITOR_W = 22, MONITOR_H = 12;
const MEETING_TABLE_W = 130, MEETING_TABLE_H = 70, MEETING_CHAIR_S = 22;

function nextId(prefix: string) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

function generateDeskArea(config: SpaceConfig, ox: number, oy: number): { room: Room; furniture: Furniture[] } {
  const { rows, cols, spacing, name } = config;
  // spacing applies equally to horizontal AND vertical gaps
  const deskUnitH = DESK_H + CHAIR_S + 8; // desk + chair + small gap
  const cellW = DESK_W + spacing;     // horizontal: desk width + spacing
  const cellH = deskUnitH + spacing;   // vertical: desk+chair unit + spacing
  const pad = 15;
  const roomW = cols * cellW - spacing + pad * 2;
  const roomH = rows * cellH - spacing + pad * 2 + 10;
  const furniture: Furniture[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const dx = ox + pad + c * cellW;
      const dy = oy + pad + 10 + r * cellH;
      furniture.push({ id: nextId('d'), type: 'desk', x: dx, y: dy, w: DESK_W, h: DESK_H });
      furniture.push({ id: nextId('m'), type: 'monitor', x: dx + DESK_W / 2 - MONITOR_W / 2, y: dy + 2, w: MONITOR_W, h: MONITOR_H });
      furniture.push({ id: nextId('c'), type: 'chair', x: dx + DESK_W / 2 - CHAIR_S / 2, y: dy + DESK_H + 8, w: CHAIR_S, h: CHAIR_S });
    }
  }
  return {
    room: { id: nextId('r'), type: 'workspace', name, x: ox, y: oy, w: roomW, h: roomH, color: '#FFFFFF', wallColor: '#E5E5E5' },
    furniture,
  };
}

function generateMeeting(config: SpaceConfig, ox: number, oy: number): { room: Room; furniture: Furniture[] } {
  const roomW = MEETING_TABLE_W + 80;
  const roomH = MEETING_TABLE_H + 80;
  const tx = ox + (roomW - MEETING_TABLE_W) / 2;
  const ty = oy + (roomH - MEETING_TABLE_H) / 2;
  const furniture: Furniture[] = [];
  furniture.push({ id: nextId('t'), type: 'table', x: tx, y: ty, w: MEETING_TABLE_W, h: MEETING_TABLE_H });
  for (let i = 0; i < config.cols; i++) {
    const cx = tx + (MEETING_TABLE_W / (config.cols + 1)) * (i + 1) - MEETING_CHAIR_S / 2;
    furniture.push({ id: nextId('c'), type: 'chair', x: cx, y: ty - MEETING_CHAIR_S - 5, w: MEETING_CHAIR_S, h: MEETING_CHAIR_S });
    furniture.push({ id: nextId('c'), type: 'chair', x: cx, y: ty + MEETING_TABLE_H + 5, w: MEETING_CHAIR_S, h: MEETING_CHAIR_S, rotation: 180 });
  }
  furniture.push({ id: nextId('wb'), type: 'whiteboard', x: ox + roomW - 14, y: oy + 20, w: 8, h: roomH - 40 });
  furniture.push({ id: nextId('pl'), type: 'plant', x: ox + 6, y: oy + 6, w: 26, h: 26 });
  return {
    room: { id: nextId('r'), type: 'meeting', name: config.name, x: ox, y: oy, w: roomW, h: roomH, color: '#FFFFFF', wallColor: '#E5E5E5' },
    furniture,
  };
}

function generateLounge(_config: SpaceConfig, ox: number, oy: number): { room: Room; furniture: Furniture[] } {
  const roomW = 200, roomH = 160;
  const furniture: Furniture[] = [];
  furniture.push({ id: nextId('s'), type: 'sofa', x: ox + 15, y: oy + 20, w: 90, h: 38 });
  furniture.push({ id: nextId('s'), type: 'sofa', x: ox + 15, y: oy + 100, w: 90, h: 38 });
  furniture.push({ id: nextId('t'), type: 'table', x: ox + 25, y: oy + 65, w: 60, h: 30 });
  furniture.push({ id: nextId('pl'), type: 'plant', x: ox + 140, y: oy + 15, w: 28, h: 28 });
  furniture.push({ id: nextId('pl'), type: 'plant', x: ox + 160, y: oy + 120, w: 28, h: 28 });
  return {
    room: { id: nextId('r'), type: 'lounge', name: _config.name, x: ox, y: oy, w: roomW, h: roomH, color: '#FFFFFF', wallColor: '#E5E5E5' },
    furniture,
  };
}

function generateCafe(config: SpaceConfig, ox: number, oy: number): { room: Room; furniture: Furniture[] } {
  const { rows, cols, spacing } = config;
  const cellW = 80 + spacing;
  const cellH = 100 + spacing;
  const roomW = cols * cellW + 50;
  const roomH = rows * cellH + 40;
  const furniture: Furniture[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tx = ox + 20 + c * cellW;
      const ty = oy + 30 + r * cellH;
      furniture.push({ id: nextId('t'), type: 'table', x: tx, y: ty + 20, w: 45, h: 45 });
      // Top chairs (with gap)
      furniture.push({ id: nextId('c'), type: 'chair', x: tx + 4, y: ty, w: 18, h: 18 });
      furniture.push({ id: nextId('c'), type: 'chair', x: tx + 26, y: ty, w: 18, h: 18 });
      // Bottom chairs (with gap)
      furniture.push({ id: nextId('c'), type: 'chair', x: tx + 4, y: ty + 68, w: 18, h: 18 });
      furniture.push({ id: nextId('c'), type: 'chair', x: tx + 26, y: ty + 68, w: 18, h: 18 });
    }
  }
  furniture.push({ id: nextId('cm'), type: 'coffee-machine', x: ox + roomW - 40, y: oy + 10, w: 28, h: 28 });
  return {
    room: { id: nextId('r'), type: 'cafe', name: config.name, x: ox, y: oy, w: roomW, h: roomH, color: '#FFFFFF', wallColor: '#E5E5E5' },
    furniture,
  };
}

// ── Number input that actually works ────────────────────
function NumInput({ value, onChange, min, max, label }: { value: number; onChange: (v: number) => void; min: number; max: number; label: string }) {
  const [text, setText] = useState(String(value));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setText(raw);
    const n = parseInt(raw, 10);
    if (!isNaN(n) && n >= min && n <= max) onChange(n);
  };

  const handleBlur = () => {
    const n = parseInt(text, 10);
    if (isNaN(n) || n < min) { setText(String(min)); onChange(min); }
    else if (n > max) { setText(String(max)); onChange(max); }
    else { setText(String(n)); onChange(n); }
  };

  const inc = () => { const n = Math.min(max, value + 1); setText(String(n)); onChange(n); };
  const dec = () => { const n = Math.max(min, value - 1); setText(String(n)); onChange(n); };

  return (
    <div>
      <label className="text-[10px] text-gray-500 block mb-1">{label}</label>
      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
        <button onClick={dec} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 text-lg font-light">−</button>
        <input
          type="text"
          inputMode="numeric"
          value={text}
          onChange={handleChange}
          onBlur={handleBlur}
          className="w-full h-8 text-sm text-center focus:outline-none border-x border-gray-200"
        />
        <button onClick={inc} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 text-lg font-light">+</button>
      </div>
    </div>
  );
}

export default function SpaceWizard({ onClose }: { onClose: () => void }) {
  const { addRoom, addFurniture, floorPlan, setCamera } = useOfficeStore();
  const [config, setConfig] = useState<SpaceConfig>({
    type: 'desk-area', name: 'オープンスペース', rows: 3, cols: 4, spacing: 20, direction: 'horizontal',
  });

  const handleGenerate = () => {
    // Place below the lowest existing room
    const existingRooms = floorPlan.rooms;
    let ox = 20, oy = 20;
    if (existingRooms.length > 0) {
      const maxY = Math.max(...existingRooms.map(r => r.y + r.h));
      oy = maxY + 30;
    }

    let result: { room: Room; furniture: Furniture[] };
    switch (config.type) {
      case 'desk-area': result = generateDeskArea(config, ox, oy); break;
      case 'meeting': result = generateMeeting(config, ox, oy); break;
      case 'lounge': result = generateLounge(config, ox, oy); break;
      case 'cafe': result = generateCafe(config, ox, oy); break;
    }

    addRoom(result.room);
    result.furniture.forEach(f => addFurniture(f));

    // Zoom out to fit all rooms
    const allRooms = [...existingRooms, result.room];
    const minX = Math.min(...allRooms.map(r => r.x));
    const minY = Math.min(...allRooms.map(r => r.y));
    const maxX = Math.max(...allRooms.map(r => r.x + r.w));
    const maxY = Math.max(...allRooms.map(r => r.y + r.h));
    const totalW = maxX - minX + 80;
    const totalH = maxY - minY + 80;
    const zoom = Math.min(1, 800 / totalW, 600 / totalH);
    setCamera({ x: (minX - 40) * zoom, y: (minY - 40) * zoom, zoom });
    onClose();
  };

  const selectedType = SPACE_TYPES.find(t => t.id === config.type)!;
  const seatCount = config.type === 'desk-area' ? config.rows * config.cols
    : config.type === 'meeting' ? config.cols * 2
    : config.type === 'cafe' ? config.rows * config.cols * 2
    : 4;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[480px] overflow-hidden animate-float-in">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-800">スペースを追加</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
        </div>

        <div className="px-6 py-4 space-y-5">
          {/* Type */}
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">1. スペース種類</label>
            <div className="grid grid-cols-2 gap-2">
              {SPACE_TYPES.map(t => (
                <button key={t.id} onClick={() => setConfig(c => ({ ...c, type: t.id, name: t.label }))}
                  className={`p-3 rounded-xl border text-left transition-all ${config.type === t.id ? 'border-indigo-300 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{t.icon}</span>
                    <div>
                      <div className="text-[12px] font-semibold text-gray-800">{t.label}</div>
                      <div className="text-[10px] text-gray-500">{t.desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 block">2. 名前</label>
            <input type="text" value={config.name} onChange={e => setConfig(c => ({ ...c, name: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-300" />
          </div>

          {/* Layout */}
          {(config.type === 'desk-area' || config.type === 'cafe') && (
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">3. レイアウト</label>
              <div className="grid grid-cols-3 gap-3">
                <NumInput label="行数" value={config.rows} min={1} max={20} onChange={v => setConfig(c => ({ ...c, rows: v }))} />
                <NumInput label="列数" value={config.cols} min={1} max={20} onChange={v => setConfig(c => ({ ...c, cols: v }))} />
                <NumInput label="間隔 (px)" value={config.spacing} min={5} max={80} onChange={v => setConfig(c => ({ ...c, spacing: v }))} />
              </div>
            </div>
          )}

          {config.type === 'meeting' && (
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">3. テーブル設定</label>
              <div className="grid grid-cols-2 gap-3">
                <NumInput label="長辺の席数" value={config.cols} min={1} max={8} onChange={v => setConfig(c => ({ ...c, cols: v }))} />
                <NumInput label="短辺の席数" value={config.rows} min={0} max={4} onChange={v => setConfig(c => ({ ...c, rows: v }))} />
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-gray-500">予定座席数</div>
              <div className="text-lg font-bold text-gray-800">{seatCount} <span className="text-xs font-normal text-gray-500">席</span></div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-gray-500">スペースタイプ</div>
              <div className="text-sm font-semibold text-gray-700">{selectedType.icon} {config.name}</div>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-lg">キャンセル</button>
          <button onClick={handleGenerate} className="px-5 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700">スペースを作成</button>
        </div>
      </div>
    </div>
  );
}
