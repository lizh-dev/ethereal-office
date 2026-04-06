// Furniture set definitions — pre-configured furniture groups that are placed
// together and linked via Excalidraw groupIds for unified drag/selection.

import { FURNITURE_ASSETS } from './furnitureAssets';

type RawEl = Record<string, unknown>;

function eid() {
  return `el-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getAsset(id: string) {
  return FURNITURE_ASSETS.find(a => a.id === id)!;
}

function furEl(assetId: string, x: number, y: number, groupId: string, scale = 1): RawEl {
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
    groupIds: [groupId],
  };
}

export type FurnitureSetType = 'desk-set' | 'meeting-table' | 'sofa-set' | 'cafe-table';

export interface FurnitureSetInfo {
  type: FurnitureSetType;
  label: string;
  desc: string;
  defaultSeats: number;
  width: number;
  height: number;
}

export const FURNITURE_SET_DEFS: FurnitureSetInfo[] = [
  { type: 'desk-set', label: 'デスクセット', desc: 'デスク+モニター+チェア', defaultSeats: 1, width: 90, height: 89 },
  { type: 'meeting-table', label: 'ミーティングテーブル', desc: '丸テーブル+チェア', defaultSeats: 4, width: 200, height: 180 },
  { type: 'sofa-set', label: 'ソファセット', desc: 'ソファ+コーヒーテーブル+アームチェア', defaultSeats: 3, width: 200, height: 200 },
  { type: 'cafe-table', label: 'カフェテーブル', desc: '小テーブル+チェア×2', defaultSeats: 2, width: 65, height: 120 },
];

export interface FurnitureSetResult {
  elements: RawEl[];
  chairs: RawEl[];
  width: number;
  height: number;
}

// ── Generators ──

export function generateDeskSet(ox: number, oy: number, groupId: string): FurnitureSetResult {
  const deskW = getAsset('fur-desk').width;   // 90
  const deskH = getAsset('fur-desk').height;  // 51
  const chairW = getAsset('fur-chair-up').width; // 22
  const chairH = getAsset('fur-chair-up').height; // 35
  const monW = getAsset('fur-monitor').width; // 30
  const gap = 3;

  const elements: RawEl[] = [];
  const chairs: RawEl[] = [];

  // Desk
  elements.push(furEl('fur-desk', ox, oy, groupId));
  // Monitor centered on desk
  elements.push(furEl('fur-monitor', ox + (deskW - monW) / 2, oy + 5, groupId));
  // Chair below desk
  const chair = furEl('fur-chair-up', ox + (deskW - chairW) / 2, oy + deskH + gap, groupId);
  elements.push(chair);
  chairs.push(chair);

  return { elements, chairs, width: deskW, height: deskH + gap + chairH };
}

export function generateDeskSetFacing(ox: number, oy: number, groupId: string): FurnitureSetResult {
  const deskW = getAsset('fur-desk').width;
  const deskH = getAsset('fur-desk').height;
  const chairW = getAsset('fur-chair').width;
  const chairH = getAsset('fur-chair').height;
  const monW = getAsset('fur-monitor').width;
  const monH = getAsset('fur-monitor').height;
  const gap = 3;

  const elements: RawEl[] = [];
  const chairs: RawEl[] = [];

  // Top person: chair (down) → desk → monitor
  const topChair = furEl('fur-chair', ox + (deskW - chairW) / 2, oy, groupId);
  elements.push(topChair);
  chairs.push(topChair);
  elements.push(furEl('fur-desk', ox, oy + chairH + gap, groupId));
  elements.push(furEl('fur-monitor', ox + (deskW - monW) / 2, oy + chairH + gap + 3, groupId));

  // Bottom person: desk → monitor → chair (up)
  const bottomDeskY = oy + chairH + gap + deskH;
  elements.push(furEl('fur-desk', ox, bottomDeskY, groupId));
  elements.push(furEl('fur-monitor', ox + (deskW - monW) / 2, bottomDeskY + deskH - monH - 3, groupId));
  const bottomChair = furEl('fur-chair-up', ox + (deskW - chairW) / 2, bottomDeskY + deskH + gap, groupId);
  elements.push(bottomChair);
  chairs.push(bottomChair);

  const totalH = chairH + gap + deskH + deskH + gap + chairH;
  return { elements, chairs, width: deskW, height: totalH };
}

export function generateMeetingTable(ox: number, oy: number, groupId: string, seatCount = 4): FurnitureSetResult {
  const tblW = getAsset('fur-table-round').width;  // 65
  const tblH = getAsset('fur-table-round').height; // 65
  const chairH_v = getAsset('fur-chair').height;  // 35
  const chairW_v = getAsset('fur-chair').width;   // 22
  const chairW_h = getAsset('fur-chair-left').width; // 35
  const chairH_h = getAsset('fur-chair-left').height; // 22
  const gap = 12;

  const elements: RawEl[] = [];
  const chairs: RawEl[] = [];

  // Calculate bounding area
  const totalW = chairW_h + gap + tblW + gap + chairW_h;
  const totalH = chairH_v + gap + tblH + gap + chairH_v;

  // Table centered
  const tblX = ox + (totalW - tblW) / 2;
  const tblY = oy + (totalH - tblH) / 2;
  elements.push(furEl('fur-table-round', tblX, tblY, groupId));

  // Top row (facing down)
  const topCount = Math.min(Math.ceil(seatCount / 2), 3);
  for (let i = 0; i < topCount; i++) {
    const spread = topCount;
    const startX = tblX + (tblW - spread * (chairW_v + 8)) / 2;
    const chair = furEl('fur-chair', startX + i * (chairW_v + 8), oy, groupId);
    elements.push(chair);
    chairs.push(chair);
  }

  // Bottom row (facing up)
  const bottomCount = Math.min(seatCount - topCount, 3);
  for (let i = 0; i < bottomCount; i++) {
    const spread = bottomCount;
    const startX = tblX + (tblW - spread * (chairW_v + 8)) / 2;
    const chair = furEl('fur-chair-up', startX + i * (chairW_v + 8), oy + totalH - chairH_v, groupId);
    elements.push(chair);
    chairs.push(chair);
  }

  // Left chair (facing right)
  if (seatCount > 6) {
    const chair = furEl('fur-chair-right', ox, tblY + (tblH - chairH_h) / 2, groupId);
    elements.push(chair);
    chairs.push(chair);
  }

  // Right chair (facing left)
  if (seatCount > 7) {
    const chair = furEl('fur-chair-left', ox + totalW - chairW_h, tblY + (tblH - chairH_h) / 2, groupId);
    elements.push(chair);
    chairs.push(chair);
  }

  return { elements, chairs, width: totalW, height: totalH };
}

export function generateSofaSet(ox: number, oy: number, groupId: string): FurnitureSetResult {
  const elements: RawEl[] = [];
  const chairs: RawEl[] = [];

  // Sofa 1 (top)
  const s1 = furEl('fur-sofa', ox, oy, groupId);
  elements.push(s1);
  chairs.push(s1);

  // Coffee table
  elements.push(furEl('fur-coffee', ox + 15, oy + 65, groupId));

  // Armchair (right side)
  const ac = furEl('fur-armchair', ox + 80, oy + 55, groupId);
  elements.push(ac);
  chairs.push(ac);

  // Sofa 2 (bottom)
  const s2 = furEl('fur-sofa', ox, oy + 100, groupId);
  elements.push(s2);
  chairs.push(s2);

  return { elements, chairs, width: 130, height: 155 };
}

export function generateCafeTable(ox: number, oy: number, groupId: string): FurnitureSetResult {
  const tblScale = 0.7;
  const tblW = Math.round(getAsset('fur-table-round').width * tblScale);  // ~46
  const tblH = Math.round(getAsset('fur-table-round').height * tblScale); // ~46
  const chairW = getAsset('fur-chair').width;   // 22
  const chairH = getAsset('fur-chair').height;  // 35
  const gap = 8;

  const elements: RawEl[] = [];
  const chairs: RawEl[] = [];

  const totalW = Math.max(tblW, chairW);
  const cx = ox + totalW / 2;

  // Chair top (facing down)
  const c1 = furEl('fur-chair', cx - chairW / 2, oy, groupId);
  elements.push(c1);
  chairs.push(c1);

  // Table
  elements.push(furEl('fur-table-round', cx - tblW / 2, oy + chairH + gap, groupId, tblScale));

  // Chair bottom (facing up)
  const c2 = furEl('fur-chair-up', cx - chairW / 2, oy + chairH + gap + tblH + gap, groupId);
  elements.push(c2);
  chairs.push(c2);

  const totalH = chairH + gap + tblH + gap + chairH;
  return { elements, chairs, width: totalW, height: totalH };
}

// ── Main dispatcher ──

export function generateFurnitureSet(
  type: FurnitureSetType,
  ox: number,
  oy: number,
  groupId: string,
  options?: { seatCount?: number; facing?: boolean }
): FurnitureSetResult {
  switch (type) {
    case 'desk-set':
      return options?.facing
        ? generateDeskSetFacing(ox, oy, groupId)
        : generateDeskSet(ox, oy, groupId);
    case 'meeting-table':
      return generateMeetingTable(ox, oy, groupId, options?.seatCount ?? 4);
    case 'sofa-set':
      return generateSofaSet(ox, oy, groupId);
    case 'cafe-table':
      return generateCafeTable(ox, oy, groupId);
  }
}
