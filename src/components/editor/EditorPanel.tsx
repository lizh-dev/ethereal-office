'use client';

import { useOfficeStore } from '@/store/officeStore';
import { useRef, useState } from 'react';

export default function EditorPanel({ onAddSpace }: { onAddSpace?: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    editorMode,
    showGrid,
    setShowGrid,
    importFloorPlan,
    zones,
    setZones,
  } = useOfficeStore();

  const [editingZone, setEditingZone] = useState<string | null>(null);
  const [zonePrefix, setZonePrefix] = useState('');

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

  const handleRenameZone = (zoneId: string, newName: string) => {
    setZones(zones.map(z => z.id === zoneId ? { ...z, name: newName } : z));
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

  const totalSeats = zones.reduce((sum, z) => sum + z.seats.length, 0);

  return (
    <div className="w-[280px] bg-white border-l border-gray-200 flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-800">フロアエディター</h3>
        {onAddSpace && (
          <button
            onClick={onAddSpace}
            className="mt-2 w-full py-2.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5"
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
            ビューモードに切り替えると座席が自動検出されます
          </p>
        ) : (
          <div className="space-y-2">
            {zones.map((zone) => (
              <div key={zone.id} className="bg-gray-50 rounded-lg p-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">{zone.name}</span>
                  <span className="text-[10px] text-gray-400">{zone.seats.length}席</span>
                </div>

                {/* Seat labels preview */}
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

                {/* Edit prefix */}
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
                      // Extract current prefix from first seat label
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
          ビューモード切替で座席が自動検出されます。<br />
          各島の「ラベル変更」でプレフィックスを変更できます。
        </p>
      </div>
    </div>
  );
}
