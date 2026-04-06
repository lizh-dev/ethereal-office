import { useOfficeStore } from '@/store/officeStore';

// Chair/furniture asset IDs for seat detection
const CHAIR_FILE_IDS = new Set(['fur-chair', 'fur-chair-up', 'fur-chair-left', 'fur-chair-right']);
const SOFA_FILE_IDS = new Set(['fur-sofa', 'fur-armchair']);
const DESK_FILE_IDS = new Set(['fur-desk']);
const TABLE_FILE_IDS = new Set(['fur-table-round', 'fur-table-rect']);
const COFFEE_FILE_IDS = new Set(['fur-coffee']);

const ISLAND_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isInside(el: any, room: any) {
  const cx = el.x + (el.width || 0) / 2;
  const cy = el.y + (el.height || 0) / 2;
  return cx >= room.x && cx <= room.x + room.width && cy >= room.y && cy <= room.y + room.height;
}

export function initSeatsFromElements(elements: readonly unknown[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const els = elements as any[];

  // Detect rooms = large white rectangles (exclude locked background elements)
  const rooms = els.filter((el) =>
    el.type === 'rectangle' && !el.isDeleted && !el.locked &&
    el.backgroundColor === '#ffffff' && el.width > 150 && el.height > 100
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ).sort((a: any, b: any) => {
    const dy = a.y - b.y;
    if (Math.abs(dy) > 50) return dy;
    return a.x - b.x;
  });

  // Detect chairs: image elements with chair fileIds OR old-style ellipses
  const plantColors = ['#86ceab', '#5ead88', '#4ade80', '#22c55e', '#16a34a'];
  const allChairs = els.filter((el) => {
    if (el.isDeleted) return false;
    if (el.type === 'image' && (CHAIR_FILE_IDS.has(el.fileId) || SOFA_FILE_IDS.has(el.fileId))) return true;
    if (el.type === 'ellipse' && el.width <= 30 && el.height <= 30 && !plantColors.includes(el.backgroundColor)) return true;
    return false;
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getRoomType(room: any): 'desk' | 'meeting' | 'lounge' | 'cafe' | 'open' {
    const hasDesk = els.some(el => el.type === 'image' && DESK_FILE_IDS.has(el.fileId) && isInside(el, room));
    const hasSofa = els.some(el => el.type === 'image' && SOFA_FILE_IDS.has(el.fileId) && isInside(el, room));
    const hasTable = els.some(el => el.type === 'image' && TABLE_FILE_IDS.has(el.fileId) && isInside(el, room));
    const hasCoffee = els.some(el => el.type === 'image' && COFFEE_FILE_IDS.has(el.fileId) && isInside(el, room));
    if (hasSofa) return 'lounge';
    if (hasCoffee && hasTable) return 'cafe';
    if (hasTable && !hasDesk) return 'meeting';
    if (hasDesk) return 'desk';
    // Fallback: legacy primitives
    const desksInside = els.filter(el => el.type === 'rectangle' && !el.isDeleted && el.backgroundColor === '#e8e3dd' && isInside(el, room));
    const sofasInside = els.filter(el => el.type === 'rectangle' && !el.isDeleted && el.backgroundColor === '#c4bab0' && isInside(el, room));
    const tablesInside = els.filter(el => el.type === 'ellipse' && !el.isDeleted && el.backgroundColor === '#ddd8d2' && isInside(el, room));
    if (sofasInside.length > 0) return 'lounge';
    if (tablesInside.length > 0 && desksInside.length === 0) return 'meeting';
    if (desksInside.length > 0) return 'desk';
    return 'open';
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getRoomName(room: any): string | null {
    const textEls = els.filter((el) =>
      el.type === 'text' && !el.isDeleted &&
      el.x >= room.x - 5 && el.x <= room.x + room.width + 5 &&
      el.y >= room.y - 5 && el.y <= room.y + room.height
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ).sort((a: any, b: any) => a.y - b.y);
    return textEls[0]?.text || null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sortChairs = (arr: any[]) => [...arr].sort((a: any, b: any) => {
    const dy = a.y - b.y;
    if (Math.abs(dy) > 10) return dy;
    return a.x - b.x;
  });

  // Preserve existing labels and occupancy
  const existingZones = useOfficeStore.getState().zones;
  const existingSeatsMap = new Map<string, { label?: string; id: string; occupied?: boolean; occupiedBy?: string }>();
  for (const z of existingZones) {
    for (const s of z.seats) {
      const key = `${Math.round(s.x / 5) * 5},${Math.round(s.y / 5) * 5}`;
      existingSeatsMap.set(key, { label: s.label, id: s.id, occupied: s.occupied, occupiedBy: s.occupiedBy });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assignedChairs = new Set<any>();
  const zones = rooms.map((room, ri) => {
    const chairsInRoom = allChairs.filter((c) => {
      const cx = c.x + (c.width || 0) / 2;
      const cy = c.y + (c.height || 0) / 2;
      return cx >= room.x && cx <= room.x + room.width && cy >= room.y && cy <= room.y + room.height;
    });
    chairsInRoom.forEach((c) => assignedChairs.add(c));
    const sorted = sortChairs(chairsInRoom);
    const letter = ISLAND_LETTERS[ri % 26];
    const roomName = getRoomName(room);
    const renames = typeof sessionStorage !== 'undefined' ? JSON.parse(sessionStorage.getItem('ethereal-zone-renames') || '{}') : {};
    const zoneId = `zone-${ri}`;
    const existingZone = existingZones.find(z => z.id === zoneId);
    const detectedName = roomName || `${letter}島`;
    const finalName = renames[zoneId] || existingZone?.name || detectedName;

    return {
      id: zoneId,
      type: getRoomType(room),
      name: finalName,
      x: room.x, y: room.y, w: room.width, h: room.height,
      seats: sorted.map((c, i) => {
        const cx = c.x + (c.width || 30) / 2;
        const cy = c.y + (c.height || 30) / 2;
        const key = `${Math.round(cx / 5) * 5},${Math.round(cy / 5) * 5}`;
        const existing = existingSeatsMap.get(key);
        const defaultLabel = `${letter}-${i + 1}`;
        return {
          id: existing?.id || defaultLabel,
          roomId: zoneId,
          x: cx,
          y: cy,
          w: c.width,
          h: c.height,
          label: existing?.label || defaultLabel,
          occupied: existing?.occupied || false,
          occupiedBy: existing?.occupiedBy,
        };
      }),
    };
  });

  // ── Group-based detection for unassigned chairs ──
  // Chairs with groupIds that aren't inside any room → group into zones by groupId
  const unassigned = allChairs.filter((c) => !assignedChairs.has(c));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groupMap = new Map<string, any[]>();
  const ungrouped: typeof unassigned = [];

  for (const c of unassigned) {
    const gid = c.groupIds?.[0];
    if (gid) {
      if (!groupMap.has(gid)) groupMap.set(gid, []);
      groupMap.get(gid)!.push(c);
    } else {
      ungrouped.push(c);
    }
  }

  // For each group, create a zone and infer type from co-grouped elements
  for (const [gid, groupChairs] of groupMap) {
    // Find all elements in this group (not just chairs) to infer zone type
    const groupElements = els.filter((el) => !el.isDeleted && el.groupIds?.includes(gid));
    const hasDesk = groupElements.some((el) => el.type === 'image' && DESK_FILE_IDS.has(el.fileId));
    const hasSofa = groupElements.some((el) => el.type === 'image' && SOFA_FILE_IDS.has(el.fileId));
    const hasTable = groupElements.some((el) => el.type === 'image' && TABLE_FILE_IDS.has(el.fileId));
    const hasCoffee = groupElements.some((el) => el.type === 'image' && COFFEE_FILE_IDS.has(el.fileId));

    let zoneType: 'desk' | 'meeting' | 'lounge' | 'cafe' | 'open' = 'open';
    if (hasSofa) zoneType = 'lounge';
    else if (hasCoffee && hasTable) zoneType = 'cafe';
    else if (hasTable && !hasDesk) zoneType = 'meeting';
    else if (hasDesk) zoneType = 'desk';

    // Compute bounding box from all group elements
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const el of groupElements) {
      minX = Math.min(minX, el.x || 0);
      minY = Math.min(minY, el.y || 0);
      maxX = Math.max(maxX, (el.x || 0) + (el.width || 0));
      maxY = Math.max(maxY, (el.y || 0) + (el.height || 0));
    }

    const sorted = sortChairs(groupChairs);
    const letter = ISLAND_LETTERS[zones.length % 26];
    const zoneId = `zone-g-${gid}`;

    // Check for existing zone name or rename
    const renames = typeof sessionStorage !== 'undefined' ? JSON.parse(sessionStorage.getItem('ethereal-zone-renames') || '{}') : {};
    const existingZone = existingZones.find(z => z.id === zoneId);

    // Try to find a text element nearby for the zone name
    const nearbyText = els.find((el) =>
      el.type === 'text' && !el.isDeleted && el.groupIds?.includes(gid)
    );
    const detectedName = nearbyText?.text || `${letter}島`;
    const finalName = renames[zoneId] || existingZone?.name || detectedName;

    zones.push({
      id: zoneId,
      type: zoneType,
      name: finalName,
      x: minX, y: minY, w: maxX - minX, h: maxY - minY,
      seats: sorted.map((c, i) => {
        const cx = c.x + (c.width || 30) / 2;
        const cy = c.y + (c.height || 30) / 2;
        const key = `${Math.round(cx / 5) * 5},${Math.round(cy / 5) * 5}`;
        const existing = existingSeatsMap.get(key);
        const defaultLabel = `${letter}-${i + 1}`;
        return {
          id: existing?.id || defaultLabel,
          roomId: zoneId,
          x: cx,
          y: cy,
          w: c.width,
          h: c.height,
          label: existing?.label || defaultLabel,
          occupied: existing?.occupied || false,
          occupiedBy: existing?.occupiedBy,
        };
      }),
    });
  }

  // Remaining ungrouped, unroomed chairs → zone-other
  if (ungrouped.length > 0) {
    const sorted = sortChairs(ungrouped);
    const letter = ISLAND_LETTERS[zones.length % 26];
    zones.push({
      id: 'zone-other',
      type: 'open' as const,
      name: 'その他',
      x: 0, y: 0, w: 0, h: 0,
      seats: sorted.map((c, i) => {
        const cx = c.x + (c.width || 30) / 2;
        const cy = c.y + (c.height || 30) / 2;
        const key = `${Math.round(cx / 5) * 5},${Math.round(cy / 5) * 5}`;
        const existing = existingSeatsMap.get(key);
        const defaultLabel = `${letter}-${i + 1}`;
        return {
          id: existing?.id || defaultLabel,
          roomId: 'zone-other',
          x: cx,
          y: cy,
          w: c.width,
          h: c.height,
          label: existing?.label || defaultLabel,
          occupied: existing?.occupied || false,
          occupiedBy: existing?.occupiedBy,
        };
      }),
    });
  }

  useOfficeStore.setState({ zones });
}
