'use client';

import { useState, useMemo } from 'react';
import { convertToExcalidrawElements } from '@excalidraw/excalidraw';
import { useOfficeStore } from '@/store/officeStore';
import { getTemplateElements } from '@/lib/templates';
import { initSeatsFromElements } from '@/lib/seatDetection';
import {
  TEMPLATE_CATALOG,
  CATEGORY_INFO,
  TEAM_SIZE_INFO,
} from '@/lib/templateCatalog';
import type { TemplateCategory, TeamSize } from '@/lib/templateCatalog';
import { Search, X, Lock } from 'lucide-react';

export default function TemplatePicker({ onClose }: { onClose: () => void }) {
  const excalidrawAPI = useOfficeStore((s) => s.excalidrawAPI);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<
    TemplateCategory | 'all'
  >('all');
  const [sizeFilter, setSizeFilter] = useState<TeamSize | 'all'>('all');

  /* ---- derived data ---- */

  const categories = useMemo(() => {
    const cats = Object.entries(CATEGORY_INFO) as [
      TemplateCategory,
      (typeof CATEGORY_INFO)[TemplateCategory],
    ][];
    return cats;
  }, []);

  const filteredTemplates = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return TEMPLATE_CATALOG.filter((t) => {
      if (activeCategory !== 'all' && t.category !== activeCategory)
        return false;
      if (sizeFilter !== 'all' && t.teamSize !== sizeFilter) return false;
      if (
        q &&
        !t.name.toLowerCase().includes(q) &&
        !t.description.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [searchQuery, activeCategory, sizeFilter]);

  /* ---- handlers ---- */

  const handleApply = () => {
    if (!excalidrawAPI || !selectedId) return;

    const rawElements = getTemplateElements(selectedId);

    try {
      const converted = convertToExcalidrawElements(
        rawElements as Parameters<typeof convertToExcalidrawElements>[0],
      );
      excalidrawAPI.updateScene({ elements: converted });
      initSeatsFromElements(converted);
    } catch (e) {
      console.error('Failed to apply template:', e);
    }

    onClose();
  };

  /* ---- render ---- */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
        style={{ margin: '0 16px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            テンプレートを選択
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search + Size filter */}
        <div className="flex items-center gap-3 border-b border-zinc-100 px-6 py-3 dark:border-zinc-800">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="テンプレートを検索..."
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-3 text-xs text-zinc-800 placeholder:text-zinc-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus:border-amber-500"
            />
          </div>
          <select
            value={sizeFilter}
            onChange={(e) => setSizeFilter(e.target.value as TeamSize | 'all')}
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            <option value="all">全サイズ</option>
            {Object.entries(TEAM_SIZE_INFO).map(([key, info]) => (
              <option key={key} value={key}>
                {info.label}
              </option>
            ))}
          </select>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto border-b border-zinc-100 px-6 py-3 dark:border-zinc-800">
          <button
            onClick={() => setActiveCategory('all')}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeCategory === 'all'
                ? 'bg-accent text-zinc-950'
                : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
            }`}
          >
            すべて
          </button>
          {categories.map(([key, info]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeCategory === key
                  ? 'bg-accent text-zinc-950'
                  : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
              }`}
            >
              {info.icon} {info.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
          {filteredTemplates.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-400 dark:text-zinc-500">
              条件に合うテンプレートが見つかりません
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {filteredTemplates.map((tmpl) => {
                const catInfo =
                  CATEGORY_INFO[tmpl.category as TemplateCategory];
                const sizeInfo =
                  TEAM_SIZE_INFO[tmpl.teamSize as TeamSize];
                const isSelected = selectedId === tmpl.id;

                return (
                  <button
                    key={tmpl.id}
                    onClick={() => setSelectedId(tmpl.id)}
                    disabled={!excalidrawAPI}
                    className={`group flex flex-col gap-1.5 rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? 'border-2 border-amber-500 ring-1 ring-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20'
                        : 'border-zinc-200 bg-white hover:border-amber-400 dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:border-amber-500'
                    } ${!excalidrawAPI ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                  >
                    {/* Top row: emoji + name + pro badge */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-base leading-none">
                        {catInfo?.icon ?? '📄'}
                      </span>
                      <span className="truncate text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        {tmpl.name}
                      </span>
                      {tmpl.proOnly && (
                        <span className="ml-auto flex shrink-0 items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                          <Lock className="h-3 w-3" />
                          Pro
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="line-clamp-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                      {tmpl.description}
                    </p>

                    {/* Footer: size badge + seat count */}
                    <div className="mt-auto flex items-center gap-2">
                      {sizeInfo && (
                        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400">
                          {sizeInfo.label}
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                        {tmpl.seatCount}席
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-100 px-6 py-3 dark:border-zinc-800">
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
            {filteredTemplates.length}件のテンプレート
          </span>
          <button
            onClick={handleApply}
            disabled={!selectedId || !excalidrawAPI}
            className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-amber-600 dark:hover:bg-amber-500"
          >
            このテンプレートを使う
          </button>
        </div>
      </div>
    </div>
  );
}
