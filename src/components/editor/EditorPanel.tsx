'use client';

import { useOfficeStore } from '@/store/officeStore';
import { useRef, useState } from 'react';

const ISLAND_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export default function EditorPanel({ onAddSpace, floorSlug }: { onAddSpace?: () => void; floorSlug?: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    editorMode,
    showGrid,
    setShowGrid,
    importFloorPlan,
    zones,
    setZones,
    excalidrawAPI,
    setEditorMode,
  } = useOfficeStore();

  const [editingZone, setEditingZone] = useState<string | null>(null);
  const [zonePrefix, setZonePrefix] = useState('');
  const [saving, setSaving] = useState(false);

  if (editorMode !== 'edit') return null;

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      importFloorPlan(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleApplyPrefix = (zoneId: string, prefix: string) => {
    setZones(zones.map(z => {
      if (z.id !== zoneId) return z;
      return {
        ...z,
        seats: z.seats.map((s, i) => ({
          ...s,
          id: `${prefix}-${i + 1}`,
          label: `${prefix}-${i + 1}`,
        })),
      };
    }));
    setEditingZone(null);
    setZonePrefix('');
  };

  // Save & switch to view mode with seat re-detection
  const handleSaveAndView = async () => {
    if (!excalidrawAPI) return;
    setSaving(true);

    // 1. Re-detect seats from current Excalidraw elements
    const elements = excalidrawAPI.getSceneElements();
    if (elements && elements.length > 0) {
      redetectSeats(elements);
    }

    // 2. Save to DB
    if (floorSlug) {
      try {
        const appState = excalidrawAPI.getAppState();
        const { collaborators, ...cleanAppState } = appState;
        const scene = { elements, appState: cleanAppState };
        const tokens = JSON.parse(localStorage.getItem('ethereal-edit-tokens') || '{}');
        const editToken = tokens[floorSlug] || '';
        await fetch(`/api/floors/${floorSlug}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'X-Edit-Token': editToken },
          body: JSON.stringify({ excalidrawScene: scene }),
        });
      } catch { /* silent */ }
    }

    // 3. Notify other users via WS
    const wsSend = (window as unknown as Record<string, any>).__wsSend;
    wsSend?.sceneUpdate?.();

    // 4. Switch to view mode
    setSaving(false);
    setEditorMode('view');
  };

  // Re-detect seats preserving existing labels
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function redetectSeats(elements: any[]) {
    const els = elements.filter((el: any) => !el.isDeleted);

    const rooms = els.filter((el: any) =>
      el.type === 'rectangle' && el.backgroundColor === '#ffffff' && el.width > 150 && el.height > 100
    ).sort((a: any, b: any) => {
      const dy = a.y - b.y;
      if (Math.abs(dy) > 50) return dy;
      return a.x - b.x;
    });

    const allChairs = els.filter((el: any) =>
      el.type === 'ellipse' && el.width <= 30 && el.height <= 30 &&
      !['#86ceab', '#5ead88', '#4ade80', '#22c55e', '#16a34a'].includes(el.backgroundColor)
    );

    // Build existing label map
    const existingSeatsMap = new Map<string, { label?: string; id: string }>();
    for (const z of zones) {
      for (const s of z.seats) {
        const key = `${Math.round(s.x / 5) * 5},${Math.round(s.y / 5) * 5}`;
        existingSeatsMap.set(key, { label: s.label, id: s.id });
      }
    }

    function getRoomType(room: any): 'desk' | 'meeting' | 'lounge' | 'cafe' | 'open' {
      const desksInside = els.filter((el: any) => el.type === 'rectangle' && el.backgroundColor === '#e8e3dd' && el.x >= room.x && el.x <= room.x + room.width && el.y >= room.y && el.y <= room.y + room.height);
      const sofasInside = els.filter((el: any) => el.type === 'rectangle' && el.backgroundColor === '#c4bab0' && el.x >= room.x && el.x <= room.x + room.width && el.y >= room.y && el.y <= room.y + room.height);
      const tablesInside = els.filter((el: any) => el.type === 'ellipse' && el.backgroundColor === '#ddd8d2' && el.x >= room.x && el.x <= room.x + room.width && el.y >= room.y && el.y <= room.y + room.height);
      if (sofasInside.length > 0) return 'lounge';
      if (tablesInside.length > 0 && desksInside.length === 0) return 'meeting';
      if (desksInside.length > 0) return 'desk';
      return 'open';
    }

    function getRoomName(room: any): string | null {
      const textEls = els.filter((el: any) => el.type === 'text' && el.x >= room.x - 5 && el.x <= room.x + room.width + 5 && el.y >= room.y - 5 && el.y <= room.y + room.height).sort((a: any, b: any) => a.y - b.y);
      return textEls[0]?.text || null;
    }

    const sortChairs = (arr: any[]) => [...arr].sort((a: any, b: any) => {
      const dy = a.y - b.y;
      if (Math.abs(dy) > 10) return dy;
      return a.x - b.x;
    });

    const assignedChairs = new Set<any>();
    const newZones = rooms.map((room: any, ri: number) => {
      const chairsInRoom = allChairs.filter((c: any) => {
        const cx = c.x + c.width / 2;
        const cy = c.y + c.height / 2;
        return cx >= room.x && cx <= room.x + room.width && cy >= room.y && cy <= room.y + room.height;
      });
      chairsInRoom.forEach((c: any) => assignedChairs.add(c));
      const sorted = sortChairs(chairsInRoom);
      const letter = ISLAND_LETTERS[ri % 26];
      const roomName = getRoomName(room);
      const zoneName = roomName || `${letter}島`;

      return {
        id: `zone-${ri}`,
        type: getRoomType(room),
        name: zoneName,
        x: room.x, y: room.y, w: room.width, h: room.height,
        seats: sorted.map((c: any, i: number) => {
          const key = `${Math.round(c.x / 5) * 5},${Math.round(c.y / 5) * 5}`;
          const existing = existingSeatsMap.get(key);
          const defaultLabel = `${letter}-${i + 1}`;
          return {
            id: existing?.id || defaultLabel,
            roomId: `zone-${ri}`,
            x: c.x, y: c.y, w: c.width, h: c.height,
            label: existing?.label || defaultLabel,
            occupied: false,
            occupiedBy: undefined as string | undefined,
          };
        }),
      };
    });

    const unassigned = allChairs.filter((c: any) => !assignedChairs.has(c));
    if (unassigned.length > 0) {
      const sorted = sortChairs(unassigned);
      const letter = ISLAND_LETTERS[newZones.length % 26];
      newZones.push({
        id: 'zone-other', type: 'open' as const, name: 'その他',
        x: 0, y: 0, w: 0, h: 0,
        seats: sorted.map((c: any, i: number) => {
          const key = `${Math.round(c.x / 5) * 5},${Math.round(c.y / 5) * 5}`;
          const existing = existingSeatsMap.get(key);
          const defaultLabel = `${letter}-${i + 1}`;
          return {
            id: existing?.id || defaultLabel,
            roomId: 'zone-other',
            x: c.x, y: c.y, w: c.width, h: c.height,
            label: existing?.label || defaultLabel,
            occupied: false,
            occupiedBy: undefined as string | undefined,
          };
        }),
      });
    }

    setZones(newZones);
  }

  const totalSeats = zones.reduce((sum, z) => sum + z.seats.length, 0);

  return (
    <div className="w-[280px] bg-white border-l border-gray-200 flex flex-col h-full overflow-y-auto">
      {/* Save & Exit button - prominent at top */}
      <div className="p-3 bg-indigo-50 border-b border-indigo-100">
        <button
          onClick={handleSaveAndView}
          disabled={saving}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          {saving ? (
            <>⏳ 保存中...</>
          ) : (
            <>✅ 保存して閲覧モードへ</>
          )}
        </button>
        <p className="text-[10px] text-indigo-400 text-center mt-1.5">
          座席が自動検出されラベルが反映されます
        </p>
      </div>

      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-800">フロアエディター</h3>
        {onAddSpace && (
          <button
            onClick={onAddSpace}
            className="mt-2 w-full py-2.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <span className="text-base">+</span> スペースを追加
          </button>
        )}
        <div className="flex items-center gap-2 mt-2">
          <label className="flex items-center gap-1.5 text-xs text-gray-500">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              className="rounded"
            />
            Grid
          </label>
          <button
            onClick={handleImport}
            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            Import JSON
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />
        </div>
      </div>

      {/* Seat Label Management */}
      <div className="p-4 border-b border-gray-200">
        <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
          🏷️ 座席ラベル
          <span className="text-gray-400 font-normal">（{totalSeats}席検出）</span>
        </h4>

        {zones.length === 0 ? (
          <p className="text-[10px] text-gray-400">
            「保存して閲覧モードへ」で座席が自動検出されます
          </p>
        ) : (
          <div className="space-y-2">
            {zones.map((zone) => (
              <div key={zone.id} className="bg-gray-50 rounded-lg p-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">{zone.name}</span>
                  <span className="text-[10px] text-gray-400">{zone.seats.length}席</span>
                </div>

                <div className="flex flex-wrap gap-1 mb-2">
                  {zone.seats.slice(0, 12).map((seat) => (
                    <span key={seat.id} className="text-[9px] px-1.5 py-0.5 bg-white border border-gray-200 rounded text-gray-600 font-mono">
                      {seat.label || seat.id}
                    </span>
                  ))}
                  {zone.seats.length > 12 && (
                    <span className="text-[9px] px-1.5 py-0.5 text-gray-400">+{zone.seats.length - 12}</span>
                  )}
                </div>

                {editingZone === zone.id ? (
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={zonePrefix}
                      onChange={e => setZonePrefix(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && zonePrefix.trim()) handleApplyPrefix(zone.id, zonePrefix.trim()); }}
                      placeholder="例: A"
                      className="flex-1 text-xs px-2 py-1 border border-gray-200 rounded focus:outline-none focus:border-indigo-400"
                      autoFocus
                    />
                    <button
                      onClick={() => { if (zonePrefix.trim()) handleApplyPrefix(zone.id, zonePrefix.trim()); }}
                      disabled={!zonePrefix.trim()}
                      className="text-[10px] px-2 py-1 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-200 text-white disabled:text-gray-400 rounded font-medium"
                    >
                      適用
                    </button>
                    <button
                      onClick={() => { setEditingZone(null); setZonePrefix(''); }}
                      className="text-[10px] px-1.5 py-1 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingZone(zone.id);
                      const firstLabel = zone.seats[0]?.label || '';
                      const prefix = firstLabel.split('-')[0] || '';
                      setZonePrefix(prefix);
                    }}
                    className="text-[10px] text-indigo-500 hover:text-indigo-700 font-medium"
                  >
                    ✏️ ラベル変更
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 mt-auto">
        <p className="text-[10px] text-gray-400">
          Excalidrawのツールバーで図形を描画。<br />
          「保存して閲覧モードへ」で座席が検出されラベルが反映されます。
        </p>
      </div>
    </div>
  );
}
