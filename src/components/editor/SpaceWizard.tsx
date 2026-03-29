'use client';

import { useState } from 'react';
import { convertToExcalidrawElements } from '@excalidraw/excalidraw';
import { useOfficeStore } from '@/store/officeStore';
import { FURNITURE_ASSETS } from '@/lib/furnitureAssets';

interface SpaceConfig {
  type: 'desk-area' | 'meeting' | 'lounge' | 'cafe';
  name: string;
  rows: number;
  cols: number;
  spacing: number;
  labelPrefix: string;
  labelStart: number;
}

const SPACE_TYPES = [
  { id: 'desk-area' as const, label: 'デスクエリア', desc: 'デスク+椅子+モニター', icon: '🖥' },
  { id: 'meeting' as const, label: '会議室', desc: 'テーブル+椅子', icon: '🤝' },
  { id: 'lounge' as const, label: 'ラウンジ', desc: 'ソファ+テーブル+植物', icon: '🛋' },
  { id: 'cafe' as const, label: 'カフェスペース', desc: 'テーブル+椅子+コーヒー', icon: '☕' },
];

function eid() {
  return `el-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function gid() {
  return `g-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawEl = Record<string, unknown>;

function getAsset(id: string) {
  return FURNITURE_ASSETS.find(a => a.id === id)!;
}

function furEl(assetId: string, x: number, y: number, scale = 1): RawEl {
  const asset = getAsset(assetId);
  return {
    id: eid(),
    type: 'image',
    x,
    y,
    width: asset.width * scale,
    height: asset.height * scale,
    fileId: assetId,
    status: 'saved',
    strokeColor: 'transparent',
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 0,
    roundness: null,
    opacity: 100,
  };
}

function textEl(x: number, y: number, text: string, fontSize = 11): RawEl {
  return {
    type: 'text', x, y, text, fontSize, strokeColor: '#94a3b8',
  };
}

function roomBox(name: string, x: number, y: number, w: number, h: number): RawEl[] {
  return [
    { type: 'rectangle', x, y, width: w, height: h, backgroundColor: '#ffffff', strokeColor: '#e5e5e5', fillStyle: 'solid', roundness: { type: 3 }, strokeWidth: 1 },
    { type: 'text', x: x + 12, y: y + 10, text: name, fontSize: 13, strokeColor: '#6b7280' },
  ];
}

// ── Space generators using furniture image assets ──

function generateDeskArea(config: SpaceConfig, ox: number, oy: number): { elements: RawEl[]; chairs: RawEl[] } {
  const { rows, cols, spacing, name } = config;
  const deskW = getAsset('fur-desk').width;
  const cellW = deskW + spacing;
  const cellH = 80 + spacing;
  const roomW = cols * cellW + 40;
  const roomH = rows * cellH + 50;

  const elements: RawEl[] = [...roomBox(name, ox, oy, roomW, roomH)];
  const chairs: RawEl[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const dx = ox + 20 + c * cellW;
      const dy = oy + 35 + r * cellH;
      // Desk
      elements.push(furEl('fur-desk', dx, dy));
      // Monitor on desk
      elements.push(furEl('fur-monitor', dx + 30, dy + 5));
      // Chair below desk (facing up toward desk)
      const chairEl = furEl('fur-chair-up', dx + 29, dy + 55);
      elements.push(chairEl);
      chairs.push(chairEl);
    }
  }

  // Decorations
  if (cols > 1) {
    elements.push(furEl('fur-plant', ox + roomW - 45, oy + 35));
  }

  return { elements, chairs };
}

function generateMeeting(config: SpaceConfig, ox: number, oy: number): { elements: RawEl[]; chairs: RawEl[] } {
  const seats = config.cols; // seats per long side
  const roomW = Math.max(240, seats * 50 + 120);
  const roomH = 220;
  const elements: RawEl[] = [...roomBox(config.name, ox, oy, roomW, roomH)];
  const chairs: RawEl[] = [];

  // Table centered in room
  const tblW = 65, tblH = 65;
  const tblX = ox + (roomW - tblW) / 2;
  const tblY = oy + (roomH - tblH) / 2;
  elements.push(furEl('fur-table-round', tblX, tblY));

  // Center of table
  const cx = tblX + tblW / 2;
  const cy = tblY + tblH / 2;
  const dist = 55; // distance from table center to chair center
  const vChairW = 32, vChairH = 50; // vertical chair (up/down)
  const hChairW = 50, hChairH = 32; // horizontal chair (left/right)

  // Place chairs evenly around the table
  // Top row (facing down)
  for (let i = 0; i < Math.min(seats, 3); i++) {
    const spread = Math.min(seats, 3);
    const startX = cx - (spread * 35) / 2 + 2;
    const el = furEl('fur-chair', startX + i * 35, cy - dist - vChairH / 2);
    elements.push(el);
    chairs.push(el);
  }
  // Bottom row (facing up)
  for (let i = 0; i < Math.min(seats, 3); i++) {
    const spread = Math.min(seats, 3);
    const startX = cx - (spread * 35) / 2 + 2;
    const el = furEl('fur-chair-up', startX + i * 35, cy + dist - vChairH / 2);
    elements.push(el);
    chairs.push(el);
  }
  // Left (facing right)
  if (seats > 3) {
    const el = furEl('fur-chair-right', cx - dist - hChairW / 2, cy - hChairH / 2);
    elements.push(el);
    chairs.push(el);
  }
  // Right (facing left)
  if (seats > 3) {
    const el = furEl('fur-chair-left', cx + dist - hChairW / 2, cy - hChairH / 2);
    elements.push(el);
    chairs.push(el);
  }

  // Whiteboard + label
  elements.push(furEl('fur-whiteboard', ox + 10, oy + roomH - 60));
  elements.push(textEl(ox + 15, oy + roomH - 10, 'ホワイトボード'));
  elements.push(furEl('fur-plant', ox + roomW - 45, oy + 35));

  return { elements, chairs };
}

function generateLounge(config: SpaceConfig, ox: number, oy: number): { elements: RawEl[]; chairs: RawEl[] } {
  const roomW = 280;
  const roomH = 220;
  const elements: RawEl[] = [...roomBox(config.name, ox, oy, roomW, roomH)];
  const chairs: RawEl[] = [];

  // Sofa 1
  const s1 = furEl('fur-sofa', ox + 20, oy + 40);
  elements.push(s1);
  chairs.push(s1);

  // Coffee table + label
  elements.push(furEl('fur-coffee', ox + 85, oy + 105));
  elements.push(textEl(ox + 75, oy + 130, 'コーヒー'));

  // Sofa 2
  const s2 = furEl('fur-sofa', ox + 20, oy + 140);
  elements.push(s2);
  chairs.push(s2);

  // Armchair
  const ac = furEl('fur-armchair', ox + 150, oy + 80);
  elements.push(ac);
  chairs.push(ac);

  // Bookshelf + label
  elements.push(furEl('fur-bookshelf', ox + 150, oy + 140));
  elements.push(textEl(ox + 160, oy + 198, '本棚'));

  // Plant
  elements.push(furEl('fur-plant', ox + roomW - 50, oy + 35));
  elements.push(furEl('fur-plant', ox + 20, oy + roomH - 35));

  return { elements, chairs };
}

function generateCafe(config: SpaceConfig, ox: number, oy: number): { elements: RawEl[]; chairs: RawEl[] } {
  const { rows, cols, spacing, name } = config;
  const cellW = 80 + spacing;
  const cellH = 90 + spacing;
  const roomW = cols * cellW + 60;
  const roomH = rows * cellH + 60;
  const elements: RawEl[] = [...roomBox(name, ox, oy, roomW, roomH)];
  const chairs: RawEl[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tx = ox + 30 + c * cellW;
      const ty = oy + 40 + r * cellH;
      // Small table
      elements.push(furEl('fur-table-round', tx, ty + 15, 0.7));
      // 2 chairs (top and bottom)
      const c1 = furEl('fur-chair', tx + 15, ty - 10);
      const c2 = furEl('fur-chair-up', tx + 15, ty + 60);
      elements.push(c1);
      elements.push(c2);
      chairs.push(c1);
      chairs.push(c2);
    }
  }

  // Coffee machine + label
  elements.push(furEl('fur-coffee', ox + roomW - 35, oy + 35));
  elements.push(textEl(ox + roomW - 45, oy + 60, 'コーヒー'));
  elements.push(furEl('fur-plant', ox + roomW - 45, oy + roomH - 45));

  return { elements, chairs };
}

// ── Number input ──
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
        <input type="text" inputMode="numeric" value={text} onChange={handleChange} onBlur={handleBlur}
          className="w-full h-8 text-sm text-center focus:outline-none border-x border-gray-200" />
        <button onClick={inc} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 text-lg font-light">+</button>
      </div>
    </div>
  );
}

export default function SpaceWizard({ onClose }: { onClose: () => void }) {
  const excalidrawAPI = useOfficeStore((s) => s.excalidrawAPI);
  const [config, setConfig] = useState<SpaceConfig>({
    type: 'desk-area', name: 'オープンスペース', rows: 2, cols: 3, spacing: 20,
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

    let result: { elements: RawEl[]; chairs: RawEl[] };
    switch (config.type) {
      case 'desk-area': result = generateDeskArea(config, ox, oy); break;
      case 'meeting': result = generateMeeting(config, ox, oy); break;
      case 'lounge': result = generateLounge(config, ox, oy); break;
      case 'cafe': result = generateCafe(config, ox, oy); break;
    }

    // Build zone with seats from chair elements
    const zoneId = gid();
    const zoneType = config.type === 'desk-area' ? 'desk' : config.type === 'meeting' ? 'meeting' : config.type === 'cafe' ? 'cafe' : 'lounge';
    const prefix = config.labelPrefix.trim() || 'A';
    const start = config.labelStart;
    const newSeats = result.chairs.map((c, i) => {
      const label = `${prefix}-${start + i}`;
      return {
        id: label,
        roomId: zoneId,
        x: (c.x as number) + ((c.width as number) || 30) / 2,
        y: (c.y as number) + ((c.height as number) || 30) / 2,
        label,
        occupied: false,
        occupiedBy: undefined as string | undefined,
      };
    });
    const newZone = {
      id: zoneId,
      type: zoneType as 'desk' | 'meeting' | 'lounge' | 'cafe' | 'open',
      name: config.name,
      x: ox, y: oy, w: 0, h: 0,
      seats: newSeats,
    };

    const store = useOfficeStore.getState();
    store.setZones([...store.zones, newZone]);

    try {
      // Convert all elements (including images) through Excalidraw's converter
      // to ensure all required fields (seed, version, scale, etc.) are filled
      const convertedElements = convertToExcalidrawElements(
        result.elements as Parameters<typeof convertToExcalidrawElements>[0]
      );
      excalidrawAPI.updateScene({
        elements: [...excalidrawAPI.getSceneElements(), ...convertedElements],
      });
      const allElements = excalidrawAPI.getSceneElements();
      excalidrawAPI.scrollToContent(allElements, { fitToViewport: true, viewportZoomFactor: 0.9 });
    } catch (e) {
      console.error('Failed to create space:', e);
    }

    onClose();
  };

  const selectedType = SPACE_TYPES.find(t => t.id === config.type)!;
  const seatCount = config.type === 'desk-area' ? config.rows * config.cols
    : config.type === 'meeting' ? Math.min(config.cols * 2 + (config.cols > 3 ? 2 : 0), config.cols * 2 + 2)
    : config.type === 'cafe' ? config.rows * config.cols * 2
    : 3; // lounge default

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
                <NumInput label="行数" value={config.rows} min={1} max={10} onChange={v => setConfig(c => ({ ...c, rows: v }))} />
                <NumInput label="列数" value={config.cols} min={1} max={10} onChange={v => setConfig(c => ({ ...c, cols: v }))} />
                <NumInput label="間隔 (px)" value={config.spacing} min={5} max={80} onChange={v => setConfig(c => ({ ...c, spacing: v }))} />
              </div>
            </div>
          )}

          {config.type === 'meeting' && (
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">3. 席数（片側）</label>
              <NumInput label="長辺の席数" value={config.cols} min={1} max={6} onChange={v => setConfig(c => ({ ...c, cols: v }))} />
            </div>
          )}

          {/* Label */}
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
              {config.type === 'lounge' ? '3' : '4'}. 座席ラベル
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">プレフィックス</label>
                <input type="text" value={config.labelPrefix} onChange={e => setConfig(c => ({ ...c, labelPrefix: e.target.value }))}
                  placeholder="例: A, 営業, MTG"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-300" />
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
