'use client';

import { useOfficeStore } from '@/store/officeStore';
import { useWsSend } from '@/contexts/WebSocketContext';
import { initSeatsFromElements } from '@/lib/seatDetection';
import { useRef, useState } from 'react';


export default function EditorPanel({ onAddSpace, onApplyTemplate, floorSlug }: { onAddSpace?: () => void; onApplyTemplate?: () => void; floorSlug?: string }) {
  const wsSend = useWsSend();
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
  const [editingZoneName, setEditingZoneName] = useState<string | null>(null);
  const [zoneName, setZoneName] = useState('');
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

  const handleRenameZone = (zoneId: string, newName: string) => {
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return;
    const oldName = zone.name;

    // 1. Update zone in store
    setZones(zones.map(z => z.id === zoneId ? { ...z, name: newName } : z));

    // 2. Try to update matching text element in Excalidraw (if it exists on canvas)
    if (excalidrawAPI && zone.x > 0 && zone.w > 0) {
      const elements = excalidrawAPI.getSceneElements();
      let found = false;
      const updated = elements.map((el: any) => {
        if (!found && el.type === 'text' && !el.isDeleted && el.text === oldName &&
            el.x >= zone.x - 10 && el.x <= zone.x + zone.w + 10 &&
            el.y >= zone.y - 10 && el.y <= zone.y + zone.h + 10) {
          found = true;
          return { ...el, text: newName, version: (el.version || 0) + 1, versionNonce: Math.random() * 1e9 | 0 };
        }
        return el;
      });
      if (found) {
        excalidrawAPI.updateScene({ elements: updated });
      }
    }

    // Store rename mapping for persistence across re-detection
    const renames = JSON.parse(sessionStorage.getItem('ethereal-zone-renames') || '{}');
    renames[zoneId] = newName;
    sessionStorage.setItem('ethereal-zone-renames', JSON.stringify(renames));
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

    const allElements = excalidrawAPI.getSceneElements();
    // Filter out deleted elements before detection and persistence
    const elements = allElements.filter((el: any) => !el.isDeleted);

    // Always re-detect seats from current elements (preserves existing labels via position matching)
    initSeatsFromElements(elements);
    const updatedZones = useOfficeStore.getState().zones;

    // 2. Save to DB
    if (floorSlug) {
      try {
        const appState = excalidrawAPI.getAppState();
        const { collaborators, ...cleanAppState } = appState;
        const scene = { elements, appState: cleanAppState };
        const tokens = JSON.parse(localStorage.getItem('ethereal-edit-tokens') || '{}');
        const editToken = tokens[floorSlug] || '';
        const ownerPw = sessionStorage.getItem(`ethereal-owner-pw-${floorSlug}`) || '';
        await fetch(`/api/floors/${floorSlug}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'X-Edit-Token': editToken, 'X-Owner-Password': ownerPw },
          body: JSON.stringify({ excalidrawScene: scene, zones: updatedZones }),
        });
      } catch { /* silent */ }
    }

    // 2. Notify other users via WS
    wsSend.sceneUpdate();

    // 3. Switch to view mode
    setEditorMode('view');
    setSaving(false);
  };


  const totalSeats = zones.reduce((sum, z) => sum + z.seats.length, 0);

  return (
    <div className="w-full md:w-[280px] bg-white border-l border-gray-200 flex flex-col h-full overflow-y-auto"
      onKeyDown={(e) => { if (e.key === ' ') e.stopPropagation(); }}
    >
      {/* Save & Exit button - prominent at top */}
      <div className="p-3 bg-indigo-50 border-b border-indigo-100">
        <button
          onClick={handleSaveAndView}
          disabled={saving}
          tabIndex={-1}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          {saving ? (
            <>⏳ 保存中...</>
          ) : (
            <>✅ 保存して閲覧モードへ</>
          )}
        </button>
        <button
          onClick={() => {
            // Reload page to discard unsaved Excalidraw changes
            window.location.reload();
          }}
          className="w-full mt-2 py-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          キャンセル（変更を破棄）
        </button>
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
        {onApplyTemplate && (
          <button
            onClick={onApplyTemplate}
            className="mt-2 w-full py-2.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5"
          >
            &#x1F4CB; テンプレートを適用
          </button>
        )}
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => {
              if (!excalidrawAPI) return;
              const store = useOfficeStore.getState();
              const api = excalidrawAPI;
              const data = {
                version: 1,
                excalidrawScene: { elements: api.getSceneElements(), appState: (() => { const { collaborators, ...rest } = api.getAppState(); return rest; })() },
                zones: store.zones,
              };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = `floor-export.json`; a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex-1 text-xs py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-600 transition-colors"
          >
            📤 エクスポート
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 text-xs py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-600 transition-colors"
          >
            📥 インポート
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

        {zones.length > 0 && (
          <button
            onClick={() => {
              const updated = zones.map(z => ({
                ...z,
                seats: z.seats.map((s, i) => ({
                  ...s,
                  id: `${z.name}-${i + 1}`,
                  label: `${z.name}-${i + 1}`,
                })),
              }));
              setZones(updated);
            }}
            className="w-full mb-2 text-[10px] py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-medium rounded-lg transition-colors"
          >
            🔄 スペース名で一括ラベル設定
          </button>
        )}

        {zones.length === 0 ? (
          <p className="text-[10px] text-gray-400">
            「保存して閲覧モードへ」で座席が自動検出されます
          </p>
        ) : (
          <div className="space-y-2">
            {zones.map((zone) => (
              <div key={zone.id} className="bg-gray-50 rounded-lg p-2.5">
                <div className="flex items-center justify-between mb-1">
                  {editingZoneName === zone.id ? (
                    <input
                      type="text"
                      value={zoneName}
                      onChange={e => setZoneName(e.target.value)}
                      onBlur={() => { if (zoneName.trim()) handleRenameZone(zone.id, zoneName.trim()); setEditingZoneName(null); }}
                      onKeyDown={e => { if (e.key === 'Enter') { if (zoneName.trim()) handleRenameZone(zone.id, zoneName.trim()); setEditingZoneName(null); } if (e.key === 'Escape') setEditingZoneName(null); }}
                      className="text-xs font-medium text-gray-700 px-1 py-0.5 border border-indigo-300 rounded flex-1 focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    <span
                      className="text-xs font-medium text-gray-700 cursor-pointer hover:text-indigo-600 transition-colors"
                      onClick={() => { setEditingZoneName(zone.id); setZoneName(zone.name); }}
                      title="クリックで名前変更"
                    >
                      {zone.name} <span className="text-gray-400">✎</span>
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400 ml-1 flex-shrink-0">{zone.seats.length}席</span>
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
