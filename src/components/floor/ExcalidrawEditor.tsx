'use client';

import { Excalidraw, convertToExcalidrawElements } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import { getFurnitureLibrary } from './furnitureLibrary';

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
  const spaces = [
    openSpace('オープンスペース', 3, 4, 25, 50, 50),
    meetingRoom('会議室 A', 3, 520, 50),
    meetingRoom('会議室 B', 2, 520, 260),
    openSpace('エンジニアリング', 2, 3, 25, 50, 400),
    loungeArea('ラウンジ', 520, 470),
  ];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const elements = convertToExcalidrawElements(spaces.flat() as any);
  return {
    elements,
    appState: { viewBackgroundColor: '#f5f5f5', gridSize: 20 },
    scrollToContent: true,
  };
}

const ISLAND_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function initSeatsFromElements(elements: readonly unknown[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const els = elements as any[];

  // Detect "rooms" = large white rectangles (islands)
  const rooms = els.filter((el) =>
    el.type === 'rectangle' && !el.isDeleted &&
    el.backgroundColor === '#ffffff' && el.width > 150 && el.height > 100
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ).sort((a: any, b: any) => {
    const dy = a.y - b.y;
    if (Math.abs(dy) > 50) return dy;
    return a.x - b.x;
  });

  // Detect all chairs
  const allChairs = els.filter((el) =>
    el.type === 'ellipse' && !el.isDeleted &&
    el.backgroundColor === '#9ca3af' && el.width <= 30 && el.height <= 30
  );

  // Detect room type from elements inside
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getRoomType(room: any): 'desk' | 'meeting' | 'lounge' | 'cafe' | 'open' {
    const desksInside = els.filter((el) =>
      el.type === 'rectangle' && !el.isDeleted &&
      el.backgroundColor === '#e8e3dd' &&
      el.x >= room.x && el.x <= room.x + room.width &&
      el.y >= room.y && el.y <= room.y + room.height
    );
    const sofasInside = els.filter((el) =>
      el.type === 'rectangle' && !el.isDeleted &&
      el.backgroundColor === '#c4bab0' &&
      el.x >= room.x && el.x <= room.x + room.width &&
      el.y >= room.y && el.y <= room.y + room.height
    );
    const tablesInside = els.filter((el) =>
      el.type === 'ellipse' && !el.isDeleted &&
      el.backgroundColor === '#ddd8d2' &&
      el.x >= room.x && el.x <= room.x + room.width &&
      el.y >= room.y && el.y <= room.y + room.height
    );
    if (sofasInside.length > 0) return 'lounge';
    if (tablesInside.length > 0 && desksInside.length === 0) return 'meeting';
    if (desksInside.length > 0) return 'desk';
    return 'open';
  }

  // Get room name from text element inside the room
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getRoomName(room: any): string | null {
    const textEl = els.find((el) =>
      el.type === 'text' && !el.isDeleted &&
      el.x >= room.x && el.x <= room.x + room.width &&
      el.y >= room.y && el.y <= room.y + 40
    );
    return textEl?.text || null;
  }

  // Sort chairs within a room: top-to-bottom, left-to-right
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sortChairs = (arr: any[]) => [...arr].sort((a: any, b: any) => {
    const dy = a.y - b.y;
    if (Math.abs(dy) > 10) return dy;
    return a.x - b.x;
  });

  // Assign chairs to rooms
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assignedChairs = new Set<any>();
  const zones = rooms.map((room, ri) => {
    const chairsInRoom = allChairs.filter((c) => {
      const cx = c.x + c.width / 2;
      const cy = c.y + c.height / 2;
      return cx >= room.x && cx <= room.x + room.width &&
             cy >= room.y && cy <= room.y + room.height;
    });
    chairsInRoom.forEach(c => assignedChairs.add(c));

    const sorted = sortChairs(chairsInRoom);
    const letter = ISLAND_LETTERS[ri % 26];
    const roomType = getRoomType(room);
    const roomName = getRoomName(room);
    const zoneName = roomName || `${letter}島`;

    return {
      id: `zone-${ri}`,
      type: roomType,
      name: zoneName,
      x: room.x,
      y: room.y,
      w: room.width,
      h: room.height,
      seats: sorted.map((c, i) => ({
        id: `${letter}-${i + 1}`,
        roomId: `zone-${ri}`,
        x: c.x,
        y: c.y,
        w: c.width,
        h: c.height,
        label: `${letter}-${i + 1}`,
        occupied: false,
        occupiedBy: undefined as string | undefined,
      })),
    };
  });

  // Unassigned chairs go to a catch-all zone
  const unassigned = allChairs.filter(c => !assignedChairs.has(c));
  if (unassigned.length > 0) {
    const sorted = sortChairs(unassigned);
    const letter = ISLAND_LETTERS[zones.length % 26];
    zones.push({
      id: 'zone-other',
      type: 'open',
      name: 'その他',
      x: 0, y: 0, w: 0, h: 0,
      seats: sorted.map((c, i) => ({
        id: `${letter}-${i + 1}`,
        roomId: 'zone-other',
        x: c.x,
        y: c.y,
        w: c.width,
        h: c.height,
        label: `${letter}-${i + 1}`,
        occupied: false,
        occupiedBy: undefined as string | undefined,
      })),
    });
  }

  useOfficeStore.setState({ zones });
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

  const handleAPI = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (api: any) => {
      apiRef.current = api;
      setExcalidrawAPI(api);

      const lib = getFurnitureLibrary();
      api.updateLibrary({ libraryItems: lib.libraryItems, merge: true, openLibraryMenu: false });

      // Initialize seats from rendered elements
      setTimeout(() => {
        const elements = api.getSceneElements();
        if (elements && elements.length > 0) {
          initSeatsFromElements(elements);
        }
      }, 800);
    },
    [setExcalidrawAPI],
  );

  const initialData = useMemo(() => {
    // Load from DB scene if available
    if (savedScene && typeof savedScene === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const scene = savedScene as any;
      if (Array.isArray(scene.elements) && scene.elements.length > 0) {
        return {
          elements: scene.elements,
          appState: scene.appState ?? { viewBackgroundColor: '#f5f5f5', gridSize: 20 },
          scrollToContent: true,
        };
      }
    }
    // New floor: use default template
    return getDefaultInitialData();
  }, [savedScene]);

  const setExcalidrawAppState = useOfficeStore((s) => s.setExcalidrawAppState);

  const handleChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (elements: readonly any[], appState: any) => {
      setExcalidrawAppState(appState);

      // Debounced save to DB
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const slug = floorSlugRef.current;
        if (!slug) return;
        try {
          const { collaborators, ...cleanAppState } = appState;
          const scene = { elements, appState: cleanAppState };
          // Also save to localStorage as fallback
          localStorage.setItem(`ethereal-scene-${slug}`, JSON.stringify(scene));
          // Save to DB via API
          fetch(`/api/floors/${slug}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ excalidrawScene: scene }),
          }).catch(() => { /* silently fail, localStorage has backup */ });
        } catch { /* ignore */ }
      }, DEBOUNCE_MS);
    },
    [setExcalidrawAppState],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100%' }} className={viewMode ? 'excalidraw-view-mode' : ''}>
      <style>{`
        .excalidraw-view-mode .excalidraw .App-menu,
        .excalidraw-view-mode .excalidraw .layer-ui__wrapper__top-right,
        .excalidraw-view-mode .excalidraw .layer-ui__wrapper__footer-left,
        .excalidraw-view-mode .excalidraw .App-toolbar-container,
        .excalidraw-view-mode .excalidraw .HintViewer {
          display: none !important;
        }
      `}</style>
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
