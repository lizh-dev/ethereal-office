'use client';

import dynamic from 'next/dynamic';
import { useRef, useState, useEffect } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import type { Zone, Seat } from '@/types';

const Editor = dynamic(() => import('./ExcalidrawEditor'), {
  ssr: false,
  loading: () => <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>読み込み中...</div>,
});

const VirtualOffice = dynamic(() => import('@/components/office/VirtualOffice'), {
  ssr: false,
  loading: () => <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', backgroundColor: '#e8e4df' }}>バーチャルオフィスを準備中...</div>,
});

// Analyze Excalidraw elements to auto-generate seats
// Chairs are ellipses with backgroundColor #9ca3af
// Rooms are large rectangles with backgroundColor #ffffff
function autoGenerateZones(elements: any[]): Zone[] {
  if (!elements || elements.length === 0) return [];

  // Find rooms (large white rectangles)
  const rooms = elements.filter((el: any) =>
    el.type === 'rectangle' &&
    el.backgroundColor === '#ffffff' &&
    el.width > 100 && el.height > 80 &&
    !el.isDeleted
  );

  // Find chairs (small ellipses with chair color)
  const chairs = elements.filter((el: any) =>
    el.type === 'ellipse' &&
    (el.backgroundColor === '#9ca3af' || el.strokeColor === '#78716c') &&
    el.width <= 30 && el.height <= 30 &&
    !el.isDeleted
  );

  // Find text labels
  const labels = elements.filter((el: any) => el.type === 'text' && !el.isDeleted);

  const zones: Zone[] = [];

  rooms.forEach((room: any, idx: number) => {
    // Find the label for this room
    const label = labels.find((l: any) =>
      l.x >= room.x && l.x <= room.x + room.w &&
      l.y >= room.y && l.y <= room.y + 30
    );
    const name = label?.text || `スペース ${idx + 1}`;

    // Find chairs inside this room
    const roomChairs = chairs.filter((c: any) =>
      c.x >= room.x - 5 && c.x + c.width <= room.x + room.width + 5 &&
      c.y >= room.y - 5 && c.y + c.height <= room.y + room.height + 5
    );

    // Determine zone type from room content
    const hasDesks = elements.some((el: any) =>
      el.type === 'rectangle' &&
      el.backgroundColor === '#e8e3dd' &&
      el.x >= room.x && el.x + el.width <= room.x + room.width &&
      el.y >= room.y && el.y + el.height <= room.y + room.height &&
      !el.isDeleted
    );
    const hasSofas = elements.some((el: any) =>
      el.type === 'rectangle' &&
      el.backgroundColor === '#c4bab0' &&
      el.x >= room.x && el.x + el.width <= room.x + room.width &&
      !el.isDeleted
    );
    const hasOvalTable = elements.some((el: any) =>
      el.type === 'ellipse' &&
      el.backgroundColor === '#ddd8d2' &&
      el.width > 50 &&
      el.x >= room.x && el.x + el.width <= room.x + room.width &&
      !el.isDeleted
    );

    let type: Zone['type'] = 'open';
    if (hasDesks) type = 'desk';
    else if (hasOvalTable) type = 'meeting';
    else if (hasSofas) type = 'lounge';

    const seats: Seat[] = roomChairs.map((c: any, ci: number) => ({
      id: `auto-seat-${idx}-${ci}`,
      roomId: room.id || `room-${idx}`,
      x: c.x + c.width / 2,
      y: c.y + c.height / 2,
      occupied: false,
    }));

    if (seats.length > 0) {
      zones.push({
        id: `auto-zone-${idx}`,
        type,
        name,
        x: room.x,
        y: room.y,
        w: room.width,
        h: room.height,
        seats,
      });
    }
  });

  return zones;
}

export default function FloorCanvas() {
  const ref = useRef<HTMLDivElement>(null);
  const [h, setH] = useState(600);
  const editorMode = useOfficeStore((s) => s.editorMode);
  const excalidrawAPI = useOfficeStore((s) => s.excalidrawAPI);
  const setZones = useOfficeStore((s) => s.setZones);
  const isViewMode = editorMode !== 'edit';
  const prevModeRef = useRef(editorMode);

  useEffect(() => {
    const update = () => { if (ref.current) setH(ref.current.clientHeight); };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // When switching from edit → view, auto-generate zones from Excalidraw elements
  useEffect(() => {
    if (prevModeRef.current === 'edit' && editorMode !== 'edit' && excalidrawAPI) {
      try {
        const elements = excalidrawAPI.getSceneElements();
        const zones = autoGenerateZones(elements);
        if (zones.length > 0) {
          setZones(zones);
        }
      } catch (e) {
        console.error('Failed to auto-generate zones:', e);
      }
    }
    prevModeRef.current = editorMode;
  }, [editorMode, excalidrawAPI, setZones]);

  return (
    <div ref={ref} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div style={{
        width: '100%', height: `${h}px`,
        ...(isViewMode ? { position: 'absolute', left: -9999, top: -9999, visibility: 'hidden' as const } : {}),
      }}>
        <Editor viewMode={false} />
      </div>
      {isViewMode && (
        <div style={{ width: '100%', height: `${h}px` }}>
          <VirtualOffice />
        </div>
      )}
    </div>
  );
}
