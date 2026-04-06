'use client';

import { useState } from 'react';
import { convertToExcalidrawElements } from '@excalidraw/excalidraw';
import { useOfficeStore } from '@/store/officeStore';
import { FURNITURE_SET_DEFS, generateFurnitureSet } from '@/lib/furnitureSets';
import type { FurnitureSetType } from '@/lib/furnitureSets';
import { Monitor, Handshake, Sofa, Coffee } from 'lucide-react';

function gid() {
  return `g-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const SET_ICONS: Record<FurnitureSetType, React.ReactNode> = {
  'desk-set': <Monitor className="w-[18px] h-[18px]" strokeWidth={1.8} />,
  'meeting-table': <Handshake className="w-[18px] h-[18px]" strokeWidth={1.8} />,
  'sofa-set': <Sofa className="w-[18px] h-[18px]" strokeWidth={1.8} />,
  'cafe-table': <Coffee className="w-[18px] h-[18px]" strokeWidth={1.8} />,
};

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
      <label className="text-[10px] text-zinc-500 dark:text-zinc-400 block mb-1">{label}</label>
      <div className="flex items-center border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
        <button onClick={dec} className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-300 text-lg font-light">−</button>
        <input type="text" inputMode="numeric" value={text} onChange={handleChange} onBlur={handleBlur}
          className="w-full h-8 text-sm text-center bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none border-x border-zinc-200 dark:border-zinc-700" />
        <button onClick={inc} className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-300 text-lg font-light">+</button>
      </div>
    </div>
  );
}

export default function SpaceWizard({ onClose }: { onClose: () => void }) {
  const excalidrawAPI = useOfficeStore((s) => s.excalidrawAPI);
  const [setType, setSetType] = useState<FurnitureSetType>('desk-set');
  const [quantity, setQuantity] = useState(4);
  const [meetingSeats, setMeetingSeats] = useState(4);
  const [facing, setFacing] = useState(false);
  const [labelPrefix, setLabelPrefix] = useState('A');
  const [labelStart, setLabelStart] = useState(1);

  const setDef = FURNITURE_SET_DEFS.find(d => d.type === setType)!;

  const totalSeats = (() => {
    if (setType === 'desk-set') return quantity * (facing ? 2 : 1);
    if (setType === 'meeting-table') return quantity * Math.min(meetingSeats * 2 + (meetingSeats > 3 ? 2 : 0), meetingSeats * 2 + 2);
    if (setType === 'sofa-set') return quantity * 3;
    if (setType === 'cafe-table') return quantity * 2;
    return 0;
  })();

  const handleGenerate = () => {
    if (!excalidrawAPI) return;

    // Find placement position below existing elements
    const existingElements = excalidrawAPI.getSceneElements() as Array<{ x: number; y: number; width?: number; height?: number }>;
    let oy = 50;
    if (existingElements.length > 0) {
      const maxY = Math.max(...existingElements.map((el) => (el.y ?? 0) + (el.height ?? 0)));
      oy = maxY + 40;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allElements: Record<string, unknown>[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allChairs: Record<string, unknown>[] = [];
    const zones: Array<{
      id: string;
      type: 'desk' | 'meeting' | 'lounge' | 'cafe' | 'open';
      name: string;
      x: number; y: number; w: number; h: number;
      seats: Array<{ id: string; roomId: string; x: number; y: number; label: string; occupied: boolean; occupiedBy?: string }>;
    }> = [];

    const cols = Math.min(quantity, 4);
    const spacing = 30;
    let seatIdx = 0;

    for (let i = 0; i < quantity; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      // Estimate set dimensions for grid layout
      const setW = setDef.width + spacing;
      const setH = setDef.height + spacing;
      const ox = 50 + col * (setW + 20);
      const setOy = oy + row * (setH + 20);

      const groupId = gid();
      const result = generateFurnitureSet(setType, ox, setOy, groupId, {
        seatCount: meetingSeats,
        facing,
      });

      allElements.push(...result.elements);
      allChairs.push(...result.chairs);

      // Create zone for this set
      const zoneType = setType === 'desk-set' ? 'desk' : setType === 'meeting-table' ? 'meeting' : setType === 'sofa-set' ? 'lounge' : 'cafe';
      const zoneId = groupId;
      const prefix = labelPrefix.trim() || 'A';

      const seats = result.chairs.map((c) => {
        const label = `${prefix}-${labelStart + seatIdx}`;
        seatIdx++;
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

      zones.push({
        id: zoneId,
        type: zoneType as 'desk' | 'meeting' | 'lounge' | 'cafe' | 'open',
        name: `${setDef.label}-${i + 1}`,
        x: ox, y: setOy, w: result.width, h: result.height,
        seats,
      });
    }

    // Update store zones
    const store = useOfficeStore.getState();
    store.setZones([...store.zones, ...zones]);

    try {
      const convertedElements = convertToExcalidrawElements(
        allElements as Parameters<typeof convertToExcalidrawElements>[0]
      );
      excalidrawAPI.updateScene({
        elements: [...excalidrawAPI.getSceneElements(), ...convertedElements],
      });
      const allEls = excalidrawAPI.getSceneElements();
      excalidrawAPI.scrollToContent(allEls, { fitToViewport: true, viewportZoomFactor: 0.9 });
    } catch (e) {
      console.error('Failed to place furniture sets:', e);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-[480px] mx-4 max-h-[80vh] overflow-y-auto animate-float-in border border-zinc-200 dark:border-zinc-700">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
          <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">家具セットを配置</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 text-lg">&times;</button>
        </div>

        <div className="px-6 py-4 space-y-5">
          {/* Set type */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">1. セットの種類</label>
            <div className="grid grid-cols-2 gap-2">
              {FURNITURE_SET_DEFS.map(def => (
                <button key={def.type} onClick={() => { setSetType(def.type); setLabelPrefix(def.label); }}
                  className={`p-3 rounded-xl border text-left transition-all ${setType === def.type ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20' : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-600 dark:text-amber-400">{SET_ICONS[def.type]}</span>
                    <div>
                      <div className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-200">{def.label}</div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400">{def.desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">2. 数量</label>
            <NumInput label="配置するセット数" value={quantity} min={1} max={20} onChange={setQuantity} />
          </div>

          {/* Desk set options */}
          {setType === 'desk-set' && (
            <div>
              <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">3. 配置パターン</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setFacing(false)}
                  className={`p-3 rounded-xl border text-left transition-all ${!facing ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20' : 'border-zinc-200 dark:border-zinc-700'}`}
                >
                  <div className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-200">↓ 片面</div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400">1席/セット</div>
                </button>
                <button
                  onClick={() => setFacing(true)}
                  className={`p-3 rounded-xl border text-left transition-all ${facing ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20' : 'border-zinc-200 dark:border-zinc-700'}`}
                >
                  <div className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-200">↕ 対面</div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400">2席/セット</div>
                </button>
              </div>
            </div>
          )}

          {/* Meeting seat count */}
          {setType === 'meeting-table' && (
            <div>
              <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">3. テーブル席数</label>
              <div className="flex gap-2">
                {[2, 4, 6, 8].map(n => (
                  <button
                    key={n}
                    onClick={() => setMeetingSeats(n)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${meetingSeats === n ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'}`}
                  >
                    {n}人
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Labels */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">
              {setType === 'desk-set' ? '4' : setType === 'meeting-table' ? '4' : '3'}. 座席ラベル
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-zinc-500 dark:text-zinc-400 block mb-1">プレフィックス</label>
                <input type="text" value={labelPrefix} onChange={e => setLabelPrefix(e.target.value)}
                  placeholder="例: A, 営業"
                  className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg focus:outline-none focus:border-amber-400" />
              </div>
              <NumInput label="開始番号" value={labelStart} min={1} max={999} onChange={setLabelStart} />
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {Array.from({ length: Math.min(totalSeats, 8) }, (_, i) => (
                <span key={i} className="text-[9px] px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded text-amber-700 dark:text-amber-400 font-mono">
                  {labelPrefix.trim() || 'A'}-{labelStart + i}
                </span>
              ))}
              {totalSeats > 8 && <span className="text-[9px] text-zinc-400">... +{totalSeats - 8}</span>}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">合計座席数</div>
              <div className="text-lg font-bold text-zinc-800 dark:text-zinc-200">{totalSeats} <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">席</span></div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">配置数</div>
              <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{SET_ICONS[setType]} {quantity}×{setDef.label}</div>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-700 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">キャンセル</button>
          <button onClick={handleGenerate} disabled={!excalidrawAPI}
            className="px-5 py-2 bg-accent hover:bg-accent-hover text-zinc-950 text-xs font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">
            家具セットを配置
          </button>
        </div>
      </div>
    </div>
  );
}
