'use client';

import { useOfficeStore } from '@/store/officeStore';
import { FurnitureType, RoomType } from '@/types';
import { useRef } from 'react';

const furnitureItems: { type: FurnitureType; label: string; icon: string }[] = [
  { type: 'desk', label: 'Desk', icon: '🖥' },
  { type: 'chair', label: 'Chair', icon: '🪑' },
  { type: 'sofa', label: 'Sofa', icon: '🛋' },
  { type: 'table', label: 'Table', icon: '◻' },
  { type: 'plant', label: 'Plant', icon: '🌿' },
  { type: 'printer', label: 'Printer', icon: '🖨' },
  { type: 'bookshelf', label: 'Shelf', icon: '📚' },
  { type: 'whiteboard', label: 'Board', icon: '📋' },
  { type: 'monitor', label: 'Monitor', icon: '🖥' },
  { type: 'coffee-machine', label: 'Coffee', icon: '☕' },
  { type: 'partition', label: 'Wall', icon: '▮' },
];

const roomItems: { type: RoomType; label: string; color: string }[] = [
  { type: 'workspace', label: 'Workspace', color: '#93C5FD' },
  { type: 'meeting', label: 'Meeting', color: '#86EFAC' },
  { type: 'lounge', label: 'Lounge', color: '#FDBA74' },
  { type: 'cafe', label: 'Café', color: '#F9A8D4' },
  { type: 'open', label: 'Open Area', color: '#D4D4D4' },
];

export default function EditorPanel({ onAddSpace }: { onAddSpace?: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    editorMode,
    selectedFurnitureId,
    selectedRoomId,
    floorPlan,
    showGrid,
    addFurnitureFromPalette,
    addRoomFromPalette,
    removeFurniture,
    removeRoom,
    updateRoom,
    setShowGrid,
    importFloorPlan,
  } = useOfficeStore();

  if (editorMode !== 'edit') return null;

  const selectedFurniture = floorPlan.furniture.find((f) => f.id === selectedFurnitureId);
  const selectedRoom = floorPlan.rooms.find((r) => r.id === selectedRoomId);

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

  return (
    <div className="w-[260px] bg-white border-l border-gray-200 flex flex-col h-full overflow-y-auto">
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

      {/* Rooms Palette */}
      <div className="p-4 border-b border-gray-200">
        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Rooms</h4>
        <div className="grid grid-cols-2 gap-1.5">
          {roomItems.map((item) => (
            <button
              key={item.type}
              onClick={() => addRoomFromPalette(item.type, 400, 300)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-xs"
            >
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Furniture Palette */}
      <div className="p-4 border-b border-gray-200">
        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Furniture</h4>
        <div className="grid grid-cols-3 gap-1.5">
          {furnitureItems.map((item) => (
            <button
              key={item.type}
              onClick={() => addFurnitureFromPalette(item.type, 400, 300)}
              className="flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
            >
              <span className="text-base">{item.icon}</span>
              <span className="text-[10px] text-gray-600">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Selection details */}
      {selectedFurniture && (
        <div className="p-4 border-b border-gray-200">
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Selected Furniture</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>Type: {selectedFurniture.type}</div>
            <div>
              Position: ({Math.round(selectedFurniture.x)}, {Math.round(selectedFurniture.y)})
            </div>
            <div>
              Size: {selectedFurniture.w} x {selectedFurniture.h}
            </div>
          </div>
          <button
            onClick={() => removeFurniture(selectedFurniture.id)}
            className="mt-2 w-full py-1.5 bg-red-50 text-red-600 text-xs rounded-lg hover:bg-red-100 transition-colors"
          >
            Delete
          </button>
        </div>
      )}

      {selectedRoom && (
        <div className="p-4 border-b border-gray-200">
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">選択中のスペース</h4>
          <div className="space-y-2">
            <div>
              <label className="text-[10px] text-gray-500">名前</label>
              <input
                type="text"
                value={selectedRoom.name}
                onChange={(e) => updateRoom(selectedRoom.id, { name: e.target.value })}
                className="w-full mt-0.5 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-300"
              />
            </div>
            <div className="text-[11px] text-gray-500 space-y-0.5">
              <div>タイプ: {selectedRoom.type}</div>
              <div>サイズ: {selectedRoom.w} × {selectedRoom.h}</div>
              <div>位置: ({Math.round(selectedRoom.x)}, {Math.round(selectedRoom.y)})</div>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-gray-400 mb-1">※ ドラッグで移動（家具も一緒に動きます）</div>
          <button
            onClick={() => removeRoom(selectedRoom.id)}
            className="w-full py-2 bg-red-50 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors"
          >
            🗑 スペース全体を削除
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="p-4 mt-auto">
        <div className="text-[10px] text-gray-400 space-y-0.5">
          <div>Rooms: {floorPlan.rooms.length}</div>
          <div>Furniture: {floorPlan.furniture.length}</div>
          <div>
            Canvas: {floorPlan.width} x {floorPlan.height}
          </div>
        </div>
      </div>
    </div>
  );
}
