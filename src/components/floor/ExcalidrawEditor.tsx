'use client';

import { Excalidraw, convertToExcalidrawElements } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import { getFurnitureLibrary } from './furnitureLibrary';
import { registerFurnitureFiles, generateIsometricDemoFloor } from '@/lib/furnitureAssets';

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

  // Detect all chairs = small ellipses (any color, width/height <= 30)
  // Exclude plants (green tones) and large decorative ellipses
  const plantColors = ['#86ceab', '#5ead88', '#4ade80', '#22c55e', '#16a34a'];
  const allChairs = els.filter((el) =>
    el.type === 'ellipse' && !el.isDeleted &&
    el.width <= 30 && el.height <= 30 &&
    !plantColors.includes(el.backgroundColor)
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

  // Get room name from text element inside the room (search full room area)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getRoomName(room: any): string | null {
    // Find all text elements within the room bounds
    const textEls = els.filter((el) =>
      el.type === 'text' && !el.isDeleted &&
      el.x >= room.x - 5 && el.x <= room.x + room.width + 5 &&
      el.y >= room.y - 5 && el.y <= room.y + room.height
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ).sort((a: any, b: any) => a.y - b.y); // topmost text first
    return textEls[0]?.text || null;
  }

  // Sort chairs within a room: top-to-bottom, left-to-right
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sortChairs = (arr: any[]) => [...arr].sort((a: any, b: any) => {
    const dy = a.y - b.y;
    if (Math.abs(dy) > 10) return dy;
    return a.x - b.x;
  });

  // Get existing zones to preserve labels
  const existingZones = useOfficeStore.getState().zones;
  const existingSeatsMap = new Map<string, { label?: string; id: string }>();
  for (const z of existingZones) {
    for (const s of z.seats) {
      // Key by approximate position (round to nearest 5px)
      const key = `${Math.round(s.x / 5) * 5},${Math.round(s.y / 5) * 5}`;
      existingSeatsMap.set(key, { label: s.label, id: s.id });
    }
  }

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
    const zoneId = `zone-${ri}`;
    // Preserve user renames, then existing zone names, then auto-detected
    let renames: Record<string, string> = {};
    try { renames = JSON.parse(sessionStorage.getItem('ethereal-zone-renames') || '{}'); } catch {}
    const existingZone = existingZones.find(z => z.id === zoneId);
    const detectedName = roomName || `${letter}島`;
    const finalName = renames[zoneId] || existingZone?.name || detectedName;

    return {
      id: zoneId,
      type: roomType,
      name: finalName,
      x: room.x,
      y: room.y,
      w: room.width,
      h: room.height,
      seats: sorted.map((c, i) => {
        const key = `${Math.round(c.x / 5) * 5},${Math.round(c.y / 5) * 5}`;
        const existing = existingSeatsMap.get(key);
        const defaultLabel = `${letter}-${i + 1}`;
        return {
        id: existing?.id || defaultLabel,
        roomId: `zone-${ri}`,
        x: c.x,
        y: c.y,
        w: c.width,
        h: c.height,
        label: existing?.label || defaultLabel,
        occupied: false,
        occupiedBy: undefined as string | undefined,
      };
      }),
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
      seats: sorted.map((c, i) => {
        const key = `${Math.round(c.x / 5) * 5},${Math.round(c.y / 5) * 5}`;
        const existing = existingSeatsMap.get(key);
        const defaultLabel = `${letter}-${i + 1}`;
        return {
        id: existing?.id || defaultLabel,
        roomId: 'zone-other',
        x: c.x,
        y: c.y,
        w: c.width,
        h: c.height,
        label: existing?.label || defaultLabel,
        occupied: false,
        occupiedBy: undefined as string | undefined,
      };
      }),
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

  const isIsometric = useMemo(() => {
    if (savedScene && typeof savedScene === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const scene = savedScene as any;
      if (!Array.isArray(scene.elements)) return false;
      // Check for isometric marker (new template) or existing image elements
      return scene.elements.some(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (el: any) => el.type === '__isometric_marker__' || (el.type === 'image' && el.fileId?.startsWith('fur-'))
      );
    }
    return false;
  }, [savedScene]);

  const handleAPI = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (api: any) => {
      apiRef.current = api;
      setExcalidrawAPI(api);

      const lib = getFurnitureLibrary();
      api.updateLibrary({ libraryItems: lib.libraryItems, merge: true, openLibraryMenu: false });

      // If the scene has isometric furniture images, register the image files
      // then refresh scene so Excalidraw can render them
      if (isIsometric) {
        registerFurnitureFiles(api).then(() => {
          // Force Excalidraw to re-render images by updating scene
          const els = api.getSceneElements();
          api.updateScene({ elements: [...els] });
          setTimeout(() => initSeatsFromElements(api.getSceneElements()), 500);
        }).catch(console.error);
      }

      // Initialize seats from rendered elements
      setTimeout(() => {
        const elements = api.getSceneElements();
        if (elements && elements.length > 0) {
          initSeatsFromElements(elements);
        }
      }, 800);
    },
    [setExcalidrawAPI, isIsometric],
  );

  const initialData = useMemo(() => {
    // Load from DB scene if available
    if (savedScene && typeof savedScene === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const scene = savedScene as any;
      if (Array.isArray(scene.elements) && scene.elements.length > 0) {
        // Check for isometric marker (new floor with isometric template)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hasMarker = scene.elements.some((el: any) => el.type === '__isometric_marker__');
        if (hasMarker) {
          const isoElements = generateIsometricDemoFloor();
          return {
            elements: isoElements,
            appState: { viewBackgroundColor: '#f0f9ff', gridSize: 20 },
            scrollToContent: true,
            files: {},
          };
        }
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
          // Save to DB via API (with edit token)
          const tokens = JSON.parse(localStorage.getItem('ethereal-edit-tokens') || '{}');
          const editToken = tokens[slug] || '';
          const ownerPw = sessionStorage.getItem(`ethereal-owner-pw-${slug}`) || '';
          fetch(`/api/floors/${slug}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'X-Edit-Token': editToken, 'X-Owner-Password': ownerPw },
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
        /* Edit mode: hide file menu but keep drawing toolbar */
        .excalidraw-edit-mode .excalidraw .App-menu,
        .excalidraw-edit-mode .excalidraw .layer-ui__wrapper__top-right {
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
