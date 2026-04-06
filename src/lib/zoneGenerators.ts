// Zone generators - extracted from SpaceWizard for reuse in template system
import { FURNITURE_ASSETS } from '@/lib/furnitureAssets';

type RawEl = Record<string, unknown>;

// Helper functions
function eid() {
  return `el-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getAsset(id: string) {
  return FURNITURE_ASSETS.find(a => a.id === id)!;
}

function furEl(assetId: string, x: number, y: number, scale = 1): RawEl {
  const asset = getAsset(assetId);
  return {
    id: eid(),
    type: 'image',
    x,
    y,
    width: asset.width * scale,
    height: asset.height * scale,
    fileId: assetId,
    status: 'saved',
    strokeColor: 'transparent',
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 0,
    roundness: null,
    opacity: 100,
  };
}

function textEl(x: number, y: number, text: string, fontSize = 11): RawEl {
  return {
    type: 'text', x, y, text, fontSize, strokeColor: '#94a3b8',
  };
}

function roomBox(name: string, x: number, y: number, w: number, h: number, transparent = false): RawEl[] {
  if (transparent) {
    // Label only — no visible rectangle (used when background image provides room visuals)
    return [
      { type: 'text', x: x + 12, y: y + 10, text: name, fontSize: 13, strokeColor: '#6b7280' },
    ];
  }
  return [
    { type: 'rectangle', x, y, width: w, height: h, backgroundColor: '#ffffff', strokeColor: '#e5e5e5', fillStyle: 'solid', roundness: { type: 3 }, strokeWidth: 1 },
    { type: 'text', x: x + 12, y: y + 10, text: name, fontSize: 13, strokeColor: '#6b7280' },
  ];
}

export interface ZoneResult {
  elements: RawEl[];
  chairs: RawEl[];
  width: number;
  height: number;
}

export interface DeskAreaConfig {
  name: string;
  rows: number;
  cols: number;
  spacing?: number;
  deskLayout?: 'single' | 'facing';
}

export interface MeetingConfig {
  name: string;
  seats: number;
}

export interface LoungeConfig {
  name: string;
}

export interface CafeConfig {
  name: string;
  rows: number;
  cols: number;
  spacing?: number;
}

export interface ClassroomConfig {
  name: string;
  rows: number;
  cols: number;
}

export interface ReceptionConfig {
  name: string;
}

// ── Zone Generators ──

export function generateDeskArea(config: DeskAreaConfig, ox: number, oy: number): ZoneResult {
  const { rows, cols, name } = config;
  const spacing = config.spacing ?? 20;
  const deskLayout = config.deskLayout ?? 'facing';

  const deskW = getAsset('fur-desk').width;   // 90
  const deskH = getAsset('fur-desk').height;  // 51
  const chairW = getAsset('fur-chair-up').width;  // 22
  const chairH = getAsset('fur-chair-up').height; // 35
  const monW = getAsset('fur-monitor').width;  // 30
  const monH = getAsset('fur-monitor').height; // 29
  const cellW = deskW + spacing;

  const elements: RawEl[] = [];
  const chairs: RawEl[] = [];

  if (deskLayout === 'facing') {
    const chairDeskGap = 3;
    const pairH = chairH + chairDeskGap + deskH + deskH + chairDeskGap + chairH;
    const cellH = pairH + spacing;
    const chairCenterX = (deskW - chairW) / 2;
    const pairRows = rows;
    const roomW = cols * cellW + 40;
    const roomH = pairRows * cellH + 50;
    elements.push(...roomBox(name, ox, oy, roomW, roomH));

    for (let r = 0; r < pairRows; r++) {
      for (let c = 0; c < cols; c++) {
        const dx = ox + 20 + c * cellW;
        const baseY = oy + 35 + r * cellH;

        const topChairY = baseY;
        const topDeskY = topChairY + chairH + chairDeskGap;
        const bottomDeskY = topDeskY + deskH;
        const bottomChairY = bottomDeskY + deskH + chairDeskGap;

        // Top person
        const topChairEl = furEl('fur-chair', dx + chairCenterX, topChairY);
        elements.push(topChairEl);
        chairs.push(topChairEl);
        elements.push(furEl('fur-desk', dx, topDeskY));
        elements.push(furEl('fur-monitor', dx + (deskW - monW) / 2, topDeskY + 3));

        // Bottom person
        elements.push(furEl('fur-desk', dx, bottomDeskY));
        elements.push(furEl('fur-monitor', dx + (deskW - monW) / 2, bottomDeskY + deskH - monH - 3));
        const bottomChairEl = furEl('fur-chair-up', dx + chairCenterX, bottomChairY);
        elements.push(bottomChairEl);
        chairs.push(bottomChairEl);
      }
    }

    if (cols > 1) {
      elements.push(furEl('fur-plant', ox + roomW - 45, oy + 35));
    }

    return { elements, chairs, width: roomW, height: roomH };
  } else {
    // single layout
    const singleGap = 3;
    const cellH = deskH + singleGap + chairH + spacing;
    const chairCenterXs = (deskW - chairW) / 2;
    const roomW = cols * cellW + 40;
    const roomH = rows * cellH + 50;
    elements.push(...roomBox(name, ox, oy, roomW, roomH));

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const dx = ox + 20 + c * cellW;
        const dy = oy + 35 + r * cellH;
        elements.push(furEl('fur-desk', dx, dy));
        elements.push(furEl('fur-monitor', dx + (deskW - monW) / 2, dy + 5));
        const chairEl = furEl('fur-chair-up', dx + chairCenterXs, dy + deskH + singleGap);
        elements.push(chairEl);
        chairs.push(chairEl);
      }
    }

    if (cols > 1) {
      elements.push(furEl('fur-plant', ox + roomW - 45, oy + 35));
    }

    return { elements, chairs, width: roomW, height: roomH };
  }
}

export function generateMeetingRoom(config: MeetingConfig, ox: number, oy: number): ZoneResult {
  const seats = config.seats;
  const tblW = 65, tblH = 65;
  const vChairH = 35;
  const hChairW = 35, hChairH = 22;
  const gap = 15;
  const roomW = Math.max(280, seats * 40 + tblW + hChairW * 2 + gap * 2 + 80);
  const roomH = tblH + vChairH * 2 + gap * 2 + 80;
  const elements: RawEl[] = [...roomBox(config.name, ox, oy, roomW, roomH)];
  const chairs: RawEl[] = [];

  // Table centered
  const tblX = ox + (roomW - tblW) / 2;
  const tblY = oy + (roomH - tblH) / 2;
  elements.push(furEl('fur-table-round', tblX, tblY));

  // Top row (facing down)
  for (let i = 0; i < Math.min(seats, 3); i++) {
    const spread = Math.min(seats, 3);
    const startX = tblX + (tblW - spread * 38) / 2;
    const el = furEl('fur-chair', startX + i * 38, tblY - vChairH - gap);
    elements.push(el);
    chairs.push(el);
  }
  // Bottom row (facing up)
  for (let i = 0; i < Math.min(seats, 3); i++) {
    const spread = Math.min(seats, 3);
    const startX = tblX + (tblW - spread * 38) / 2;
    const el = furEl('fur-chair-up', startX + i * 38, tblY + tblH + gap);
    elements.push(el);
    chairs.push(el);
  }
  // Left (facing right)
  if (seats > 3) {
    const el = furEl('fur-chair-right', tblX - hChairW - gap, tblY + (tblH - hChairH) / 2);
    elements.push(el);
    chairs.push(el);
  }
  // Right (facing left)
  if (seats > 3) {
    const el = furEl('fur-chair-left', tblX + tblW + gap, tblY + (tblH - hChairH) / 2);
    elements.push(el);
    chairs.push(el);
  }

  // Whiteboard + label
  elements.push(furEl('fur-whiteboard', ox + 10, oy + roomH - 60));
  elements.push(textEl(ox + 15, oy + roomH - 10, 'ホワイトボード'));
  elements.push(furEl('fur-plant', ox + roomW - 45, oy + 35));

  return { elements, chairs, width: roomW, height: roomH };
}

export function generateLounge(config: LoungeConfig, ox: number, oy: number): ZoneResult {
  const roomW = 280;
  const roomH = 220;
  const elements: RawEl[] = [...roomBox(config.name, ox, oy, roomW, roomH)];
  const chairs: RawEl[] = [];

  // Sofa 1
  const s1 = furEl('fur-sofa', ox + 20, oy + 40);
  elements.push(s1);
  chairs.push(s1);

  // Coffee table + label
  elements.push(furEl('fur-coffee', ox + 85, oy + 105));
  elements.push(textEl(ox + 75, oy + 130, 'コーヒー'));

  // Sofa 2
  const s2 = furEl('fur-sofa', ox + 20, oy + 140);
  elements.push(s2);
  chairs.push(s2);

  // Armchair
  const ac = furEl('fur-armchair', ox + 150, oy + 80);
  elements.push(ac);
  chairs.push(ac);

  // Bookshelf + label
  elements.push(furEl('fur-bookshelf', ox + 150, oy + 140));
  elements.push(textEl(ox + 160, oy + 198, '本棚'));

  // Plants
  elements.push(furEl('fur-plant', ox + roomW - 50, oy + 35));
  elements.push(furEl('fur-plant', ox + 20, oy + roomH - 35));

  return { elements, chairs, width: roomW, height: roomH };
}

export function generateCafe(config: CafeConfig, ox: number, oy: number): ZoneResult {
  const { rows, cols, name } = config;
  const spacing = config.spacing ?? 20;

  const tblScale = 0.7;
  const tblW = Math.round(getAsset('fur-table-round').width * tblScale);
  const tblH = Math.round(getAsset('fur-table-round').height * tblScale);
  const chW = getAsset('fur-chair').width;   // 22
  const chH = getAsset('fur-chair').height;  // 35
  const gap = 8;
  const setH = chH + gap + tblH + gap + chH;
  const cellW = Math.max(tblW, chW) + spacing + 20;
  const cellH = setH + spacing;
  const roomW = cols * cellW + 60;
  const roomH = rows * cellH + 60;
  const elements: RawEl[] = [...roomBox(name, ox, oy, roomW, roomH)];
  const chairs: RawEl[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = ox + 30 + c * cellW + cellW / 2;
      const baseY = oy + 40 + r * cellH;

      // Chair top (facing down toward table)
      const c1 = furEl('fur-chair', cx - chW / 2, baseY);
      elements.push(c1);
      chairs.push(c1);

      // Table centered
      elements.push(furEl('fur-table-round', cx - tblW / 2, baseY + chH + gap, tblScale));

      // Chair bottom (facing up toward table)
      const c2 = furEl('fur-chair-up', cx - chW / 2, baseY + chH + gap + tblH + gap);
      elements.push(c2);
      chairs.push(c2);
    }
  }

  // Coffee machine + label
  elements.push(furEl('fur-coffee', ox + roomW - 35, oy + 35));
  elements.push(textEl(ox + roomW - 45, oy + 60, 'コーヒー'));
  elements.push(furEl('fur-plant', ox + roomW - 45, oy + roomH - 45));

  return { elements, chairs, width: roomW, height: roomH };
}

export function generateClassroom(config: ClassroomConfig, ox: number, oy: number): ZoneResult {
  const { rows, cols, name } = config;

  const deskW = getAsset('fur-desk').width;   // 90
  const deskH = getAsset('fur-desk').height;  // 51
  const chairW = getAsset('fur-chair-up').width;  // 22
  const chairH = getAsset('fur-chair-up').height; // 35
  const wbW = getAsset('fur-whiteboard').width;   // 80
  const spacing = 20;
  const singleGap = 3;

  const cellW = deskW + spacing;
  const cellH = deskH + singleGap + chairH + spacing;

  // Room dimensions: whiteboard row at top + student rows
  const wbRowH = 70; // space for whiteboard at front
  const roomW = cols * cellW + 40;
  const roomH = wbRowH + rows * cellH + 50;

  const elements: RawEl[] = [...roomBox(name, ox, oy, roomW, roomH)];
  const chairs: RawEl[] = [];

  // Whiteboard at front (centered)
  const wbX = ox + (roomW - wbW) / 2;
  elements.push(furEl('fur-whiteboard', wbX, oy + 30));
  elements.push(textEl(wbX, oy + 30 + 52, 'ホワイトボード'));

  // Student desks - all facing the same direction (single layout, facing up toward whiteboard)
  const chairCenterX = (deskW - chairW) / 2;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const dx = ox + 20 + c * cellW;
      const dy = oy + wbRowH + 20 + r * cellH;

      // Chair first (facing up toward whiteboard)
      const chairEl = furEl('fur-chair-up', dx + chairCenterX, dy);
      elements.push(chairEl);
      chairs.push(chairEl);

      // Desk below chair
      elements.push(furEl('fur-desk', dx, dy + chairH + singleGap));
    }
  }

  // Plant in corner
  elements.push(furEl('fur-plant', ox + roomW - 45, oy + 35));

  return { elements, chairs, width: roomW, height: roomH };
}

export function generateReception(config: ReceptionConfig, ox: number, oy: number): ZoneResult {
  const roomW = 280;
  const roomH = 220;
  const elements: RawEl[] = [...roomBox(config.name, ox, oy, roomW, roomH)];
  const chairs: RawEl[] = [];

  // Reception desk at top center
  const deskW = getAsset('fur-desk').width;
  elements.push(furEl('fur-desk', ox + (roomW - deskW) / 2, oy + 35));

  // Receptionist chair behind desk (facing down)
  const chairW = getAsset('fur-chair').width;
  const chairEl = furEl('fur-chair', ox + (roomW - chairW) / 2, oy + 35 - 3 - 35);
  // Place chair above desk area (not visible seat, but functional)
  // Actually place receptionist behind desk
  const receptionistChair = furEl('fur-chair-up', ox + (roomW - chairW) / 2, oy + 35 + 51 + 3);
  elements.push(receptionistChair);
  chairs.push(receptionistChair);

  // Rug in the center
  elements.push(furEl('fur-rug', ox + (roomW - 85) / 2, oy + 110));

  // Two armchairs facing the desk (for visitors)
  const ac1 = furEl('fur-armchair', ox + 60, oy + 140);
  elements.push(ac1);
  chairs.push(ac1);

  const ac2 = furEl('fur-armchair', ox + 170, oy + 140);
  elements.push(ac2);
  chairs.push(ac2);

  // Plant in corner
  elements.push(furEl('fur-plant', ox + 20, oy + 35));
  elements.push(furEl('fur-plant', ox + roomW - 50, oy + 35));

  return { elements, chairs, width: roomW, height: roomH };
}
