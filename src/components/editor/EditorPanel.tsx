'use client';

import { useOfficeStore } from '@/store/officeStore';
import { useRef } from 'react';

export default function EditorPanel({ onAddSpace }: { onAddSpace?: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    editorMode,
    showGrid,
    setShowGrid,
    importFloorPlan,
  } = useOfficeStore();

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

      <div className="p-4 mt-auto">
        <p className="text-[10px] text-gray-400">
          Excalidrawのツールバーを使って図形や家具を描画してください。
        </p>
      </div>
    </div>
  );
}
