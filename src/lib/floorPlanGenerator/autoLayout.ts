// Auto-layout engine: given room types + counts, calculates positions automatically
import type { FloorPlanConfig, RoomDef, FloorRoomType } from './types';

interface RoomRequest {
  type: FloorRoomType;
  name: string;
}

// Default room sizes per type
const ROOM_SIZE: Record<FloorRoomType, { w: number; h: number }> = {
  'workspace':  { w: 500, h: 400 },
  'meeting':    { w: 350, h: 300 },
  'executive':  { w: 350, h: 300 },
  'open-area':  { w: 600, h: 500 },
  'break-room': { w: 300, h: 250 },
  'reception':  { w: 400, h: 250 },
  'cafe':       { w: 350, h: 300 },
};

// Default names per type
export const ROOM_TYPE_NAMES: Record<FloorRoomType, string> = {
  'workspace':  'ワークスペース',
  'meeting':    '会議室',
  'executive':  '役員室',
  'open-area':  'オープンエリア',
  'break-room': '休憩室',
  'reception':  '受付',
  'cafe':       'カフェ',
};

export function autoLayoutRooms(requests: RoomRequest[], floorW: number, floorH: number): RoomDef[] {
  const pad = 8; // exterior wall thickness
  const usableW = floorW - pad * 2;
  const usableH = floorH - pad * 2;

  if (requests.length === 0) return [];
  if (requests.length === 1) {
    return [makeSingleRoom(requests[0], pad, pad, usableW, usableH, 0)];
  }

  // Sort: larger rooms first (workspace, open-area), smaller rooms later
  const priority: Record<FloorRoomType, number> = {
    'open-area': 0, 'workspace': 1, 'reception': 2,
    'executive': 3, 'meeting': 4, 'cafe': 5, 'break-room': 6,
  };
  const sorted = [...requests].map((r, i) => ({ ...r, origIdx: i }))
    .sort((a, b) => priority[a.type] - priority[b.type]);

  // Use a grid-based packing approach
  const rooms: RoomDef[] = [];

  if (requests.length === 2) {
    // Side by side: 60/40 split
    const w1 = Math.round(usableW * 0.6);
    const w2 = usableW - w1;
    rooms.push(makeSingleRoom(sorted[0], pad, pad, w1, usableH, 0));
    rooms.push(makeSingleRoom(sorted[1], pad + w1, pad, w2, usableH, 1));
  } else if (requests.length === 3) {
    // Left large + right top/bottom
    const w1 = Math.round(usableW * 0.6);
    const w2 = usableW - w1;
    const h2 = Math.round(usableH * 0.55);
    rooms.push(makeSingleRoom(sorted[0], pad, pad, w1, usableH, 0));
    rooms.push(makeSingleRoom(sorted[1], pad + w1, pad, w2, h2, 1));
    rooms.push(makeSingleRoom(sorted[2], pad + w1, pad + h2, w2, usableH - h2, 2));
  } else if (requests.length === 4) {
    // 2x2 grid
    const w1 = Math.round(usableW * 0.55);
    const w2 = usableW - w1;
    const h1 = Math.round(usableH * 0.55);
    const h2 = usableH - h1;
    rooms.push(makeSingleRoom(sorted[0], pad, pad, w1, h1, 0));
    rooms.push(makeSingleRoom(sorted[1], pad + w1, pad, w2, h1, 1));
    rooms.push(makeSingleRoom(sorted[2], pad, pad + h1, w1, h2, 2));
    rooms.push(makeSingleRoom(sorted[3], pad + w1, pad + h1, w2, h2, 3));
  } else if (requests.length <= 6) {
    // Top row 3 + bottom row rest
    const topCount = Math.ceil(requests.length / 2);
    const bottomCount = requests.length - topCount;
    const h1 = Math.round(usableH * 0.55);
    const h2 = usableH - h1;

    for (let i = 0; i < topCount; i++) {
      const cellW = Math.round(usableW / topCount);
      const x = pad + i * cellW;
      const w = i === topCount - 1 ? usableW - i * cellW : cellW;
      rooms.push(makeSingleRoom(sorted[i], x, pad, w, h1, i));
    }
    for (let i = 0; i < bottomCount; i++) {
      const cellW = Math.round(usableW / bottomCount);
      const x = pad + i * cellW;
      const w = i === bottomCount - 1 ? usableW - i * cellW : cellW;
      rooms.push(makeSingleRoom(sorted[topCount + i], x, pad + h1, w, h2, topCount + i));
    }
  } else {
    // 3 rows for 7+ rooms
    const rowCount = 3;
    const perRow = Math.ceil(requests.length / rowCount);
    const rowH = Math.round(usableH / rowCount);

    let idx = 0;
    for (let row = 0; row < rowCount && idx < sorted.length; row++) {
      const remaining = sorted.length - idx;
      const thisRowCount = Math.min(perRow, remaining);
      const cellW = Math.round(usableW / thisRowCount);
      const y = pad + row * rowH;
      const h = row === rowCount - 1 ? usableH - row * rowH : rowH;

      for (let col = 0; col < thisRowCount; col++) {
        const x = pad + col * cellW;
        const w = col === thisRowCount - 1 ? usableW - col * cellW : cellW;
        rooms.push(makeSingleRoom(sorted[idx], x, y, w, h, idx));
        idx++;
      }
    }
  }

  return rooms;
}

function makeSingleRoom(req: RoomRequest, x: number, y: number, w: number, h: number, idx: number): RoomDef {
  // Auto doors: place door on left or top interior wall
  const doors = [];
  if (idx > 0) {
    // Add a door on the left wall (if room is not on the left edge) or top wall
    if (x > 20) {
      doors.push({ wall: 3 as const, position: 0.5, width: 60 });
    } else {
      doors.push({ wall: 0 as const, position: 0.5, width: 60 });
    }
  }

  // Auto windows: on exterior edges (top or outer walls)
  const windows = [];
  if (y <= 12) {
    // Top exterior — add 1-2 windows
    if (w > 400) {
      windows.push({ wall: 0 as const, position: 0.3 });
      windows.push({ wall: 0 as const, position: 0.7 });
    } else {
      windows.push({ wall: 0 as const, position: 0.5 });
    }
  }

  return {
    id: `r${idx + 1}`,
    type: req.type,
    name: req.name,
    x, y, width: w, height: h,
    doors,
    windows,
  };
}

// Calculate recommended floor size from room count
export function recommendFloorSize(roomCount: number): { width: number; height: number } {
  if (roomCount <= 1) return { width: 800, height: 500 };
  if (roomCount <= 2) return { width: 1000, height: 500 };
  if (roomCount <= 3) return { width: 1200, height: 640 };
  if (roomCount <= 4) return { width: 1400, height: 700 };
  if (roomCount <= 6) return { width: 1600, height: 800 };
  return { width: 2000, height: 1000 };
}

// Build full config from room requests
export function buildConfigFromRequests(requests: RoomRequest[]): FloorPlanConfig {
  const { width, height } = recommendFloorSize(requests.length);
  const rooms = autoLayoutRooms(requests, width, height);

  // Auto decorations: plants in corners
  const pad = 8;
  const decorations = [
    { type: 'plant' as const, x: pad + 15, y: pad + 15 },
    { type: 'plant' as const, x: width - pad - 15, y: pad + 15 },
    { type: 'plant' as const, x: pad + 15, y: height - pad - 15 },
    { type: 'plant' as const, x: width - pad - 15, y: height - pad - 15 },
  ];

  return {
    width,
    height,
    style: 'modern',
    backgroundColor: '#f5f0e8',
    exteriorWallThickness: 8,
    interiorWallThickness: 6,
    rooms,
    decorations,
  };
}
