'use client';

import { useState, useMemo } from 'react';
import { convertToExcalidrawElements } from '@excalidraw/excalidraw';
import { useOfficeStore } from '@/store/officeStore';
import { FLOOR_BACKGROUNDS, BACKGROUND_CATEGORIES, loadBackgroundFile, createBackgroundElement, BG_ELEMENT_ID } from '@/lib/backgroundAssets';
import type { BackgroundCategory } from '@/lib/backgroundAssets';
import { Search, X, Image, Lock, Building2 } from 'lucide-react';

export default function BackgroundPicker({ onClose, onOpenFloorPlanDesigner }: { onClose: () => void; onOpenFloorPlanDesigner?: () => void }) {
  const excalidrawAPI = useOfficeStore((s) => s.excalidrawAPI);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<BackgroundCategory | 'all'>('all');
  const [applying, setApplying] = useState(false);

  const filtered = useMemo(() => {
    return FLOOR_BACKGROUNDS.filter(bg => {
      if (category !== 'all' && bg.category !== category) return false;
      if (search && !bg.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [category, search]);

  const handleApply = async () => {
    if (!excalidrawAPI || !selectedId) return;
    const bg = FLOOR_BACKGROUNDS.find(b => b.id === selectedId);
    if (!bg) return;

    setApplying(true);
    try {
      // Load and register the background image file
      const file = await loadBackgroundFile(bg);
      excalidrawAPI.addFiles([file]);

      // Remove existing background element if any
      const existing = excalidrawAPI.getSceneElements();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const withoutBg = existing.filter((el: any) =>
        el.id !== BG_ELEMENT_ID && !(el.type === 'image' && el.fileId?.startsWith('bg-') && el.locked)
      );

      // Create new background element and convert
      const bgRaw = createBackgroundElement(bg);
      const converted = convertToExcalidrawElements(
        [bgRaw] as Parameters<typeof convertToExcalidrawElements>[0]
      );

      // Place background at the beginning (bottom layer), then existing elements on top
      excalidrawAPI.updateScene({
        elements: [...converted, ...withoutBg],
      });

      onClose();
    } catch (e) {
      console.error('Failed to apply background:', e);
    } finally {
      setApplying(false);
    }
  };

  const handleRemove = () => {
    if (!excalidrawAPI) return;
    const existing = excalidrawAPI.getSceneElements();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const withoutBg = existing.filter((el: any) =>
      el.id !== BG_ELEMENT_ID && !(el.type === 'image' && el.fileId?.startsWith('bg-') && el.locked)
    );
    excalidrawAPI.updateScene({ elements: withoutBg });
    onClose();
  };

  const categories = Object.entries(BACKGROUND_CATEGORIES);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden animate-float-in border border-zinc-200 dark:border-zinc-700">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">背景画像を選択</h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 text-lg">&times;</button>
        </div>

        {/* Search + filters */}
        <div className="px-6 py-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="背景を検索..."
                className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-amber-500/50"
              />
            </div>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setCategory('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${category === 'all' ? 'bg-accent text-zinc-950' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'}`}
            >
              すべて
            </button>
            {categories.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setCategory(key as BackgroundCategory)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${category === key ? 'bg-accent text-zinc-950' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="p-4 max-h-[400px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Image className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">
                {FLOOR_BACKGROUNDS.length === 0
                  ? '背景画像がまだ登録されていません。public/assets/backgrounds/ に画像を配置し、backgroundAssets.ts に登録してください。'
                  : '条件に合う背景が見つかりません。'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filtered.map(bg => (
                <button
                  key={bg.id}
                  onClick={() => setSelectedId(bg.id)}
                  className={`group relative rounded-xl overflow-hidden border-2 transition-all text-left ${
                    selectedId === bg.id
                      ? 'border-amber-500 ring-1 ring-amber-500/30'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-amber-400'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <img
                      src={bg.src}
                      alt={bg.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden flex-col items-center justify-center">
                      <Image className="w-6 h-6 text-zinc-300" />
                    </div>
                  </div>
                  {/* Info */}
                  <div className="px-3 py-2">
                    <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate flex items-center gap-1">
                      {bg.name}
                      {bg.proOnly && <Lock className="w-3 h-3 text-zinc-400" />}
                    </div>
                    <div className="text-[10px] text-zinc-500">{bg.width}x{bg.height}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleRemove}
              className="text-xs text-zinc-500 hover:text-red-500 transition-colors"
            >
              背景を削除
            </button>
            {onOpenFloorPlanDesigner && (
              <button
                onClick={() => { onClose(); onOpenFloorPlanDesigner(); }}
                className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                <Building2 className="w-3 h-3" />
                フロアプランを作成
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">{filtered.length}件</span>
            <button
              onClick={handleApply}
              disabled={!selectedId || applying}
              className="px-5 py-2 bg-accent hover:bg-accent-hover text-zinc-950 font-semibold text-sm rounded-xl transition-all disabled:opacity-50"
            >
              {applying ? '適用中...' : 'この背景を使う'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
