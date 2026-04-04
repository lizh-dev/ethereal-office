'use client';

import { Excalidraw, convertToExcalidrawElements } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import { getFurnitureLibrary } from './furnitureLibrary';
import { preloadFurnitureFiles, generateIsometricDemoFloor, type FurnitureTheme } from '@/lib/furnitureAssets';
import { initSeatsFromElements } from '@/lib/seatDetection';

const DEBOUNCE_MS = 2000;

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  try {
    const spaces = [
      openSpace('オープンスペース', 3, 4, 25, 50, 50),
      meetingRoom('会議室 A', 3, 520, 50),
      meetingRoom('会議室 B', 2, 520, 260),
      openSpace('エンジニアリング', 2, 3, 25, 50, 400),
      loungeArea('ラウンジ', 520, 470),
    ];
    const flat = spaces.flat();
    if (!flat || flat.length === 0) {
      return { elements: [], appState: { viewBackgroundColor: '#f5f5f5', gridSize: 20 }, scrollToContent: true };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const elements = convertToExcalidrawElements(flat as any);
    return {
      elements: elements || [],
      appState: { viewBackgroundColor: '#f5f5f5', gridSize: 20 },
      scrollToContent: true,
    };
  } catch (e) {
    console.error('Failed to create default initial data:', e);
    return { elements: [], appState: { viewBackgroundColor: '#f5f5f5', gridSize: 20 }, scrollToContent: true };
  }
}

interface ExcalidrawEditorProps {
  viewMode?: boolean;
  floorSlug?: string;
  savedScene?: unknown;
}

export default function ExcalidrawEditor({ viewMode = false, floorSlug, savedScene }: ExcalidrawEditorProps) {
  const setExcalidrawAPI = useOfficeStore((s) => s.setExcalidrawAPI);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const floorSlugRef = useRef(floorSlug);
  floorSlugRef.current = floorSlug;

  // Always pre-load furniture image files (needed for SpaceWizard on any floor)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [furnitureFiles, setFurnitureFiles] = useState<Record<string, any> | null>(null);
  const currentTheme = useOfficeStore((s) => s.furnitureTheme);

  useEffect(() => {
    preloadFurnitureFiles(currentTheme).then(setFurnitureFiles).catch(console.error);
  }, [currentTheme]);

  // Detect if this floor uses image-based furniture
  const hasImageFurniture = useMemo(() => {
    if (!savedScene || typeof savedScene !== 'object') return false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scene = savedScene as any;
    if (scene.appState?.templateId === 'isometric') return true;
    if (Array.isArray(scene.elements)) {
      return scene.elements.some(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (el: any) => el.type === '__isometric_marker__' || (el.type === 'image' && el.fileId?.startsWith('fur-'))
      );
    }
    return false;
  }, [savedScene]);

  // Build initialData — convert ALL elements (including images) through convertToExcalidrawElements
  // and include pre-loaded files
  const initialData = useMemo(() => {
    if (savedScene && typeof savedScene === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const scene = savedScene as any;
      if (Array.isArray(scene.elements)) {
        const isIsoTemplate = scene.appState?.templateId === 'isometric' ||
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          scene.elements.some((el: any) => el.type === '__isometric_marker__');

        if (isIsoTemplate) {
          // Generate all elements and convert them ALL (including images)
          const rawElements = generateIsometricDemoFloor();
          try {
            const allConverted = convertToExcalidrawElements(
              rawElements as Parameters<typeof convertToExcalidrawElements>[0]
            );
            return {
              elements: allConverted,
              appState: { viewBackgroundColor: '#f0f9ff', gridSize: 20 },
              scrollToContent: true,
              files: furnitureFiles || {},
            };
          } catch (e) {
            console.error('Failed to convert isometric elements:', e);
          }
        }

        // Normal saved scene — pass through as-is (already converted from DB)
        const cleanElements = scene.elements.filter((el: { type: string }) => el.type !== '__isometric_marker__');
        const baseAppState = scene.appState ?? { viewBackgroundColor: '#f5f5f5', gridSize: 20 };
        // Clear selection to prevent all-selected state in view mode
        baseAppState.selectedElementIds = {};
        baseAppState.selectedGroupIds = {};
        // Restore saved zoom level from localStorage
        try {
          const savedZoom = localStorage.getItem('ethereal-zoom');
          if (savedZoom) {
            baseAppState.zoom = { value: parseFloat(savedZoom) };
          }
        } catch {}
        return {
          elements: cleanElements,
          appState: baseAppState,
          scrollToContent: true,
          files: furnitureFiles || {},
        };
      }
    }
    // No saved scene at all — shouldn't happen, but fallback to empty
    return { elements: [], appState: { viewBackgroundColor: '#f5f5f5', gridSize: 20 }, scrollToContent: true };
  }, [savedScene, furnitureFiles]);

  const handleAPI = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (api: any) => {
      apiRef.current = api;
      setExcalidrawAPI(api);

      const lib = getFurnitureLibrary();
      api.updateLibrary({ libraryItems: lib.libraryItems, merge: true, openLibraryMenu: false });

      // Register furniture files for SpaceWizard image elements
      if (furnitureFiles) {
        api.addFiles(Object.values(furnitureFiles));
      } else {
        // Files not loaded yet - load and register
        preloadFurnitureFiles(currentTheme).then(files => {
          api.addFiles(Object.values(files));
        }).catch(console.error);
      }

      // Initialize seats and auto-save isometric template on first load
      setTimeout(() => {
        const allElements = api.getSceneElements();
        // Filter out deleted elements
        const elements = allElements.filter((el: any) => !el.isDeleted);
        if (!elements || elements.length === 0) return;

        // Always re-detect seats from actual element positions.
        // DB zones are kept in store for label preservation (initSeatsFromElements
        // matches by center-coord key), but positions are recalculated from elements.
        initSeatsFromElements(elements);

        // Auto-save isometric template to DB on first load (so it persists)
        if (hasImageFurniture && floorSlugRef.current) {
          const appState = api.getAppState();
          const { collaborators, ...cleanAppState } = appState;
          const updatedZones = useOfficeStore.getState().zones;
          const tokens = JSON.parse(localStorage.getItem('ethereal-edit-tokens') || '{}');
          const editToken = tokens[floorSlugRef.current] || '';
          const ownerPw = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(`ethereal-owner-pw-${floorSlugRef.current}`) || '' : '';
          fetch(`/api/floors/${floorSlugRef.current}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'X-Edit-Token': editToken, 'X-Owner-Password': ownerPw },
            body: JSON.stringify({ excalidrawScene: { elements, appState: cleanAppState }, zones: updatedZones }),
          }).catch(() => {});
        }
      }, 1200);
    },
    [setExcalidrawAPI, furnitureFiles],
  );

  const setExcalidrawAppState = useOfficeStore((s) => s.setExcalidrawAppState);

  const handleChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (elements: readonly any[], appState: any) => {
      setExcalidrawAppState(appState);
    },
    [setExcalidrawAppState],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Wait for furniture files before rendering if this floor uses images
  if (hasImageFurniture && !furnitureFiles) {
    return <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span className="text-gray-400 text-sm">読み込み中...</span>
    </div>;
  }


  return (
    <div style={{ width: '100%', height: '100%' }} className={viewMode ? 'excalidraw-view-mode' : 'excalidraw-edit-mode'}>
      <style>{`
        /* View mode: hide everything except canvas */
        .excalidraw-view-mode .excalidraw .App-menu,
        .excalidraw-view-mode .excalidraw .layer-ui__wrapper__top-right,
        .excalidraw-view-mode .excalidraw .layer-ui__wrapper__footer-left,
        .excalidraw-view-mode .excalidraw .App-toolbar-container,
        .excalidraw-view-mode .excalidraw .HintViewer,
        .excalidraw-view-mode .excalidraw .context-menu,
        .excalidraw-view-mode .excalidraw [class*="context-menu"],
        .excalidraw-view-mode .excalidraw .popover,
        .excalidraw-view-mode .excalidraw [class*="popover"] {
          display: none !important;
        }
        /* Edit mode: hide file menu items (keep help button visible) and library button */
        .excalidraw-edit-mode .excalidraw .App-menu__left,
        .excalidraw-edit-mode .excalidraw [class*="library-button"],
        .excalidraw-edit-mode .excalidraw .library-button {
          display: none !important;
        }
      `}</style>
      <Excalidraw
        excalidrawAPI={handleAPI}
        initialData={initialData}
        gridModeEnabled={!viewMode}
        theme="light"
        langCode="ja-JP"
        viewModeEnabled={viewMode}
        onChange={handleChange}
        UIOptions={{
          canvasActions: {
            loadScene: false,
            saveToActiveFile: false,
            toggleTheme: false,
            export: false,
            saveAsImage: false,
          },
        }}
      />
    </div>
  );
}
