'use client';

import { useState } from 'react';
import { convertToExcalidrawElements } from '@excalidraw/excalidraw';
import { useOfficeStore } from '@/store/officeStore';

interface SpaceConfig {
  type: 'desk-area' | 'meeting' | 'lounge' | 'cafe';
  name: string;
  rows: number;
  cols: number;
  spacing: number;
  direction: 'horizontal' | 'vertical';
  labelPrefix: string;
  labelStart: number;
}

const SPACE_TYPES = [
  { id: 'desk-area' as const, label: 'デスクエリア', desc: 'デスク+椅子+モニター', icon: '🖥' },
  { id: 'meeting' as const, label: '会議室', desc: 'テーブル+椅子', icon: '🤝' },
  { id: 'lounge' as const, label: 'ラウンジ', desc: 'ソファ+テーブル+植物', icon: '🛋' },
  { id: 'cafe' as const, label: 'カフェスペース', desc: 'テーブル+椅子+コーヒー', icon: '☕' },
];

// ── Excalidraw element generators ───────────────────────

function gid() {
  return `g-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

type RawEl = Record<string, unknown>;

function deskSet(x: number, y: number, groupId: string): RawEl[] {
  return [
    { type: 'rectangle', x, y, width: 80, height: 40, backgroundColor: '#e8e3dd', strokeColor: '#d5d0ca', fillStyle: 'solid', roundness: { type: 3 }, groupIds: [groupId], strokeWidth: 1 },
    { type: 'rectangle', x: x + 28, y: y + 3, width: 24, height: 12, backgroundColor: '#818cf8', strokeColor: '#475569', fillStyle: 'solid', roundness: { type: 3 }, groupIds: [groupId], strokeWidth: 1 },
    { type: 'ellipse', x: x + 29, y: y + 48, width: 22, height: 22, backgroundColor: '#9ca3af', strokeColor: '#78716c', fillStyle: 'solid', groupIds: [groupId], strokeWidth: 1 },
  ];
}

function generateDeskAreaElements(config: SpaceConfig, ox: number, oy: number): RawEl[] {
  const { rows, cols, spacing, name } = config;
  const cellW = 80 + spacing;
  const cellH = 70 + spacing;
  const roomW = cols * cellW + 30;
  const roomH = rows * cellH + 50;
  const els: RawEl[] = [
    { type: 'rectangle', x: ox, y: oy, width: roomW, height: roomH, backgroundColor: '#ffffff', strokeColor: '#e5e5e5', fillStyle: 'solid', roundness: { type: 3 }, strokeWidth: 1 },
    { type: 'text', x: ox + 12, y: oy + 10, text: name, fontSize: 13, strokeColor: '#6b7280' },
  ];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      els.push(...deskSet(ox + 15 + c * cellW, oy + 35 + r * cellH, gid()));
  return els;
}

function generateMeetingElements(config: SpaceConfig, ox: number, oy: number): RawEl[] {
  const seats = config.cols;
  const els: RawEl[] = [
    { type: 'rectangle', x: ox, y: oy, width: 220, height: 160, backgroundColor: '#ffffff', strokeColor: '#e5e5e5', fillStyle: 'solid', roundness: { type: 3 }, strokeWidth: 1 },
    { type: 'text', x: ox + 12, y: oy + 10, text: config.name, fontSize: 13, strokeColor: '#6b7280' },
    { type: 'ellipse', x: ox + 45, y: oy + 45, width: 130, height: 65, backgroundColor: '#ddd8d2', strokeColor: '#ccc7c0', fillStyle: 'solid', strokeWidth: 1 },
  ];
  for (let i = 0; i < Math.min(seats, 4); i++) {
    els.push({ type: 'ellipse', x: ox + 58 + i * 32, y: oy + 28, width: 20, height: 20, backgroundColor: '#9ca3af', strokeColor: '#78716c', fillStyle: 'solid', strokeWidth: 1 });
    els.push({ type: 'ellipse', x: ox + 58 + i * 32, y: oy + 118, width: 20, height: 20, backgroundColor: '#9ca3af', strokeColor: '#78716c', fillStyle: 'solid', strokeWidth: 1 });
  }
  return els;
}

function generateLoungeElements(config: SpaceConfig, ox: number, oy: number): RawEl[] {
  return [
    { type: 'rectangle', x: ox, y: oy, width: 220, height: 170, backgroundColor: '#ffffff', strokeColor: '#e5e5e5', fillStyle: 'solid', roundness: { type: 3 }, strokeWidth: 1 },
    { type: 'text', x: ox + 12, y: oy + 10, text: config.name, fontSize: 13, strokeColor: '#6b7280' },
    { type: 'rectangle', x: ox + 15, y: oy + 35, width: 95, height: 35, backgroundColor: '#c4bab0', strokeColor: '#a8a29e', fillStyle: 'solid', roundness: { type: 3 }, strokeWidth: 1 },
    { type: 'rectangle', x: ox + 15, y: oy + 105, width: 95, height: 35, backgroundColor: '#c4bab0', strokeColor: '#a8a29e', fillStyle: 'solid', roundness: { type: 3 }, strokeWidth: 1 },
    { type: 'rectangle', x: ox + 30, y: oy + 76, width: 60, height: 24, backgroundColor: '#ddd8d2', strokeColor: '#ccc7c0', fillStyle: 'solid', roundness: { type: 3 }, strokeWidth: 1 },
    { type: 'ellipse', x: ox + 150, y: oy + 35, width: 30, height: 30, backgroundColor: '#86ceab', strokeColor: '#5ead88', fillStyle: 'solid', strokeWidth: 1 },
    { type: 'ellipse', x: ox + 165, y: oy + 115, width: 30, height: 30, backgroundColor: '#86ceab', strokeColor: '#5ead88', fillStyle: 'solid', strokeWidth: 1 },
  ];
}

function generateCafeElements(config: SpaceConfig, ox: number, oy: number): RawEl[] {
  const { rows, cols, spacing, name } = config;
  const cellW = 80 + spacing;
  const cellH = 100 + spacing;
  const roomW = cols * cellW + 50;
  const roomH = rows * cellH + 40;
  const els: RawEl[] = [
    { type: 'rectangle', x: ox, y: oy, width: roomW, height: roomH, backgroundColor: '#ffffff', strokeColor: '#e5e5e5', fillStyle: 'solid', roundness: { type: 3 }, strokeWidth: 1 },
    { type: 'text', x: ox + 12, y: oy + 10, text: name, fontSize: 13, strokeColor: '#6b7280' },
  ];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tx = ox + 20 + c * cellW;
      const ty = oy + 30 + r * cellH;
      const g = gid();
      els.push({ type: 'rectangle', x: tx, y: ty + 20, width: 45, height: 45, backgroundColor: '#ddd8d2', strokeColor: '#ccc7c0', fillStyle: 'solid', roundness: { type: 3 }, groupIds: [g], strokeWidth: 1 });
      els.push({ type: 'ellipse', x: tx + 4, y: ty, width: 18, height: 18, backgroundColor: '#9ca3af', strokeColor: '#78716c', fillStyle: 'solid', groupIds: [g], strokeWidth: 1 });
      els.push({ type: 'ellipse', x: tx + 26, y: ty, width: 18, height: 18, backgroundColor: '#9ca3af', strokeColor: '#78716c', fillStyle: 'solid', groupIds: [g], strokeWidth: 1 });
      els.push({ type: 'ellipse', x: tx + 4, y: ty + 68, width: 18, height: 18, backgroundColor: '#9ca3af', strokeColor: '#78716c', fillStyle: 'solid', groupIds: [g], strokeWidth: 1 });
      els.push({ type: 'ellipse', x: tx + 26, y: ty + 68, width: 18, height: 18, backgroundColor: '#9ca3af', strokeColor: '#78716c', fillStyle: 'solid', groupIds: [g], strokeWidth: 1 });
    }
  }
  // Coffee machine icon (small rectangle)
  els.push({ type: 'rectangle', x: ox + roomW - 40, y: oy + 10, width: 28, height: 28, backgroundColor: '#a87c5a', strokeColor: '#8b6545', fillStyle: 'solid', roundness: { type: 3 }, strokeWidth: 1 });
  return els;
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
  const excalidrawAPI = useOfficeStore((s) => s.excalidrawAPI);
  const [config, setConfig] = useState<SpaceConfig>({
    type: 'desk-area', name: 'オープンスペース', rows: 3, cols: 4, spacing: 20, direction: 'horizontal',
    labelPrefix: 'オープンスペース', labelStart: 1,
  });

  const handleGenerate = () => {
    if (!excalidrawAPI) return;

    const existingElements = excalidrawAPI.getSceneElements() as Array<{ x: number; y: number; width?: number; height?: number }>;
    let ox = 50, oy = 50;
    if (existingElements.length > 0) {
      const maxY = Math.max(...existingElements.map((el) => (el.y ?? 0) + (el.height ?? 0)));
      oy = maxY + 40;
    }

    let rawElements: RawEl[];
    switch (config.type) {
      case 'desk-area': rawElements = generateDeskAreaElements(config, ox, oy); break;
      case 'meeting': rawElements = generateMeetingElements(config, ox, oy); break;
      case 'lounge': rawElements = generateLoungeElements(config, ox, oy); break;
      case 'cafe': rawElements = generateCafeElements(config, ox, oy); break;
    }

    // Extract seat positions from chair elements (ellipses with #9ca3af)
    const chairElements = rawElements.filter(el => el.type === 'ellipse' && el.backgroundColor === '#9ca3af');
    const zoneId = gid();
    const zoneType = config.type === 'desk-area' ? 'desk' : config.type === 'meeting' ? 'meeting' : config.type === 'cafe' ? 'cafe' : 'lounge';
    const prefix = config.labelPrefix.trim() || 'A';
    const start = config.labelStart;
    const newSeats = chairElements.map((c, i) => {
      const label = `${prefix}-${start + i}`;
      return {
        id: label,
        roomId: zoneId,
        x: (c.x as number) + ((c.width as number) || 22) / 2,
        y: (c.y as number) + ((c.height as number) || 22) / 2,
        label,
        occupied: false,
        occupiedBy: undefined as string | undefined,
      };
    });
    const newZone = {
      id: zoneId,
      type: zoneType as 'desk' | 'meeting' | 'lounge' | 'cafe' | 'open',
      name: config.name,
      x: ox, y: oy,
      w: 0, h: 0, // will be computed if needed
      seats: newSeats,
    };

    // Save zone/seats to store
    const store = useOfficeStore.getState();
    store.setZones([...store.zones, newZone]);

    // Add Excalidraw elements
    try {
      const newElements = convertToExcalidrawElements(rawElements as any);
      excalidrawAPI.updateScene({
        elements: [...excalidrawAPI.getSceneElements(), ...newElements],
      });
      // Scroll to show all content (not just new elements) to avoid extreme zoom
      const allElements = excalidrawAPI.getSceneElements();
      excalidrawAPI.scrollToContent(allElements, { fitToViewport: true, viewportZoomFactor: 0.9 });
    } catch (e) {
      console.error('Failed to create space:', e);
    }

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
                <button key={t.id} onClick={() => setConfig(c => ({ ...c, type: t.id, name: t.label, labelPrefix: t.label }))}
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
            <input type="text" value={config.name} onChange={e => setConfig(c => ({ ...c, name: e.target.value, labelPrefix: e.target.value }))}
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

          {/* Label rule */}
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
              {config.type === 'meeting' ? '4' : config.type === 'lounge' ? '3' : '4'}. 座席ラベル
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">プレフィックス</label>
                <input
                  type="text"
                  value={config.labelPrefix}
                  onChange={e => setConfig(c => ({ ...c, labelPrefix: e.target.value }))}
                  placeholder="例: A, 営業, MTG"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-300"
                />
              </div>
              <NumInput label="開始番号" value={config.labelStart} min={1} max={999} onChange={v => setConfig(c => ({ ...c, labelStart: v }))} />
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {Array.from({ length: Math.min(seatCount, 8) }, (_, i) => (
                <span key={i} className="text-[9px] px-1.5 py-0.5 bg-indigo-50 border border-indigo-200 rounded text-indigo-700 font-mono">
                  {config.labelPrefix.trim() || 'A'}-{config.labelStart + i}
                </span>
              ))}
              {seatCount > 8 && <span className="text-[9px] text-gray-400">... +{seatCount - 8}</span>}
            </div>
          </div>

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
          <button onClick={handleGenerate} disabled={!excalidrawAPI}
            className="px-5 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
            スペースを作成
          </button>
        </div>
      </div>
    </div>
  );
}
