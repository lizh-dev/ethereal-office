'use client';

import { Excalidraw, convertToExcalidrawElements } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import { getFurnitureLibrary } from './furnitureLibrary';

const STORAGE_KEY = 'ethereal-office-scene';
const DEBOUNCE_MS = 1000;

function deskSet(x: number, y: number, gid: string) {
  return [
    { type: 'rectangle' as const, x, y, width: 80, height: 40, backgroundColor: '#e8e3dd', strokeColor: '#d5d0ca', fillStyle: 'solid' as const, roundness: { type: 3 as const }, groupIds: [gid], strokeWidth: 1 },
    { type: 'rectangle' as const, x: x + 28, y: y + 3, width: 24, height: 12, backgroundColor: '#818cf8', strokeColor: '#475569', fillStyle: 'solid' as const, roundness: { type: 3 as const }, groupIds: [gid], strokeWidth: 1 },
    { type: 'ellipse' as const, x: x + 29, y: y + 48, width: 22, height: 22, backgroundColor: '#9ca3af', strokeColor: '#78716c', fillStyle: 'solid' as const, groupIds: [gid], strokeWidth: 1 },
  ];
}

function openSpace(name: string, rows: number, cols: number, spacing: number, ox: number, oy: number) {
  const cellW = 80 + spacing, cellH = 70 + spacing;
  const roomW = cols * cellW + 30, roomH = rows * cellH + 50;
  const els: any[] = [
    { type: 'rectangle' as const, x: ox, y: oy, width: roomW, height: roomH, backgroundColor: '#ffffff', strokeColor: '#e5e5e5', fillStyle: 'solid' as const, roundness: { type: 3 as const }, strokeWidth: 1 },
    { type: 'text' as const, x: ox + 12, y: oy + 10, text: name, fontSize: 13, strokeColor: '#6b7280' },
  ];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      els.push(...deskSet(ox + 15 + c * cellW, oy + 35 + r * cellH, `g${ox}${r}${c}`));
  return els;
}

function meetingRoom(name: string, seats: number, ox: number, oy: number) {
  const els: any[] = [
    { type: 'rectangle' as const, x: ox, y: oy, width: 220, height: 160, backgroundColor: '#ffffff', strokeColor: '#e5e5e5', fillStyle: 'solid' as const, roundness: { type: 3 as const }, strokeWidth: 1 },
    { type: 'text' as const, x: ox + 12, y: oy + 10, text: name, fontSize: 13, strokeColor: '#6b7280' },
    { type: 'ellipse' as const, x: ox + 45, y: oy + 45, width: 130, height: 65, backgroundColor: '#ddd8d2', strokeColor: '#ccc7c0', fillStyle: 'solid' as const, strokeWidth: 1 },
  ];
  for (let i = 0; i < Math.min(seats, 4); i++) {
    els.push({ type: 'ellipse' as const, x: ox + 58 + i * 32, y: oy + 28, width: 20, height: 20, backgroundColor: '#9ca3af', strokeColor: '#78716c', fillStyle: 'solid' as const, strokeWidth: 1 });
    els.push({ type: 'ellipse' as const, x: ox + 58 + i * 32, y: oy + 118, width: 20, height: 20, backgroundColor: '#9ca3af', strokeColor: '#78716c', fillStyle: 'solid' as const, strokeWidth: 1 });
  }
  return els;
}

function loungeArea(name: string, ox: number, oy: number) {
  return [
    { type: 'rectangle' as const, x: ox, y: oy, width: 220, height: 170, backgroundColor: '#ffffff', strokeColor: '#e5e5e5', fillStyle: 'solid' as const, roundness: { type: 3 as const }, strokeWidth: 1 },
    { type: 'text' as const, x: ox + 12, y: oy + 10, text: name, fontSize: 13, strokeColor: '#6b7280' },
    { type: 'rectangle' as const, x: ox + 15, y: oy + 35, width: 95, height: 35, backgroundColor: '#c4bab0', strokeColor: '#a8a29e', fillStyle: 'solid' as const, roundness: { type: 3 as const }, strokeWidth: 1 },
    { type: 'rectangle' as const, x: ox + 15, y: oy + 105, width: 95, height: 35, backgroundColor: '#c4bab0', strokeColor: '#a8a29e', fillStyle: 'solid' as const, roundness: { type: 3 as const }, strokeWidth: 1 },
    { type: 'rectangle' as const, x: ox + 30, y: oy + 76, width: 60, height: 24, backgroundColor: '#ddd8d2', strokeColor: '#ccc7c0', fillStyle: 'solid' as const, roundness: { type: 3 as const }, strokeWidth: 1 },
    { type: 'ellipse' as const, x: ox + 150, y: oy + 35, width: 30, height: 30, backgroundColor: '#86ceab', strokeColor: '#5ead88', fillStyle: 'solid' as const, strokeWidth: 1 },
    { type: 'ellipse' as const, x: ox + 165, y: oy + 115, width: 30, height: 30, backgroundColor: '#86ceab', strokeColor: '#5ead88', fillStyle: 'solid' as const, strokeWidth: 1 },
  ];
}

function getDefaultInitialData() {
  const raw = [
    ...openSpace('オープンスペース', 3, 4, 25, 50, 50),
    ...meetingRoom('会議室 A', 3, 520, 50),
    ...meetingRoom('会議室 B', 2, 520, 260),
    ...openSpace('エンジニアリング', 2, 3, 25, 50, 400),
    ...loungeArea('ラウンジ', 520, 470),
  ];
  const elements = convertToExcalidrawElements(raw as any);
  return {
    elements,
    appState: { viewBackgroundColor: '#f5f5f5', gridSize: 20 },
    scrollToContent: true,
  };
}

function loadFromLocalStorage(): { elements: any; appState: any; scrollToContent: boolean } | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (parsed && Array.isArray(parsed.elements) && parsed.elements.length > 0) {
      return {
        elements: parsed.elements,
        appState: parsed.appState ?? {},
        scrollToContent: true,
      };
    }
    return null;
  } catch {
    return null;
  }
}

interface ExcalidrawEditorProps {
  viewMode?: boolean;
}

export default function ExcalidrawEditor({ viewMode = false }: ExcalidrawEditorProps) {
  const setExcalidrawAPI = useOfficeStore((s) => s.setExcalidrawAPI);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAPI = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (api: any) => {
      apiRef.current = api;
      setExcalidrawAPI(api);

      // Load furniture library as soon as the API is available.
      // Previously this was in a useEffect dependent on apiRef.current,
      // which never re-fired because ref mutations don't trigger renders.
      const lib = getFurnitureLibrary();
      api.updateLibrary({
        libraryItems: lib.libraryItems,
        merge: true,
        openLibraryMenu: false,
      });
    },
    [setExcalidrawAPI],
  );

  const initialData = useMemo(() => {
    return loadFromLocalStorage() ?? getDefaultInitialData();
  }, []);

  // Debounced save to localStorage
  const handleChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (elements: readonly any[], appState: any) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        try {
          const { collaborators, ...cleanAppState } = appState;
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ elements, appState: cleanAppState }),
          );
        } catch {
          // localStorage full or unavailable — silently ignore
        }
      }, DEBOUNCE_MS);
    },
    [],
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Excalidraw
        excalidrawAPI={handleAPI}
        initialData={initialData}
        gridModeEnabled={true}
        theme="light"
        langCode="ja-JP"
        viewModeEnabled={viewMode}
        onChange={handleChange}
        UIOptions={{
          canvasActions: { loadScene: false, saveToActiveFile: false, toggleTheme: false },
        }}
      />
    </div>
  );
}
