// Floor templates for Excalidraw scenes
// Zone-based architecture: templates are composed of zone generators

import { TEMPLATE_CATALOG, CATEGORY_INFO } from './templateCatalog';
import type { ZoneDef } from './templateCatalog';
import {
  generateDeskArea,
  generateMeetingRoom,
  generateLounge,
  generateCafe,
  generateClassroom,
  generateReception,
} from './zoneGenerators';
import type { ZoneResult } from './zoneGenerators';
import { generateFurnitureSet } from './furnitureSets';
import type { FurnitureSetType } from './furnitureSets';

type RawEl = Record<string, unknown>;

function gid() {
  return `g-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/* ---------- helpers ---------- */

function getCategoryIcon(category: string): string {
  const info = CATEGORY_INFO[category as keyof typeof CATEGORY_INFO];
  return info?.icon ?? '📄';
}

// Map zone type → furniture set type for set mode
const ZONE_TO_SET_TYPE: Record<string, FurnitureSetType> = {
  'desk-area': 'desk-set',
  'meeting': 'meeting-table',
  'lounge': 'sofa-set',
  'cafe': 'cafe-table',
  'classroom': 'desk-set',
  'reception': 'desk-set',
};

function generateZoneAsSet(zone: ZoneDef, ox: number, oy: number): ZoneResult {
  const setType = ZONE_TO_SET_TYPE[zone.type] || 'desk-set';
  const qty = zone.quantity ?? 1;
  const spacing = 30;
  const cols = Math.min(qty, 4);

  const allElements: RawEl[] = [];
  const allChairs: RawEl[] = [];
  let maxW = 0, maxH = 0;

  for (let i = 0; i < qty; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const setOx = ox + col * (120 + spacing);
    const setOy = oy + row * (120 + spacing);
    const groupId = gid();

    const result = generateFurnitureSet(setType, setOx, setOy, groupId, {
      seatCount: zone.seats ?? 4,
      facing: zone.deskLayout === 'facing',
    });

    allElements.push(...result.elements);
    allChairs.push(...result.chairs);
    maxW = Math.max(maxW, setOx - ox + result.width);
    maxH = Math.max(maxH, setOy - oy + result.height);
  }

  return { elements: allElements, chairs: allChairs, width: maxW, height: maxH };
}

function generateZone(zone: ZoneDef, ox: number, oy: number): ZoneResult {
  // Set mode: no room box, just furniture with groupIds
  if (zone.mode === 'set') {
    return generateZoneAsSet(zone, ox, oy);
  }

  // Room mode (default): existing behavior with roomBox
  switch (zone.type) {
    case 'desk-area':
      return generateDeskArea(
        {
          name: zone.name,
          rows: zone.rows ?? 2,
          cols: zone.cols ?? 3,
          spacing: zone.spacing ?? 20,
          deskLayout: zone.deskLayout ?? 'facing',
        },
        ox,
        oy,
      );
    case 'meeting':
      return generateMeetingRoom(
        {
          name: zone.name,
          seats: zone.seats ?? 3,
        },
        ox,
        oy,
      );
    case 'lounge':
      return generateLounge({ name: zone.name }, ox, oy);
    case 'cafe':
      return generateCafe(
        {
          name: zone.name,
          rows: zone.rows ?? 2,
          cols: zone.cols ?? 2,
          spacing: zone.spacing ?? 20,
        },
        ox,
        oy,
      );
    case 'classroom':
      return generateClassroom(
        {
          name: zone.name,
          rows: zone.rows ?? 3,
          cols: zone.cols ?? 4,
        },
        ox,
        oy,
      );
    case 'reception':
      return generateReception({ name: zone.name }, ox, oy);
  }
}

/* ---------- backward-compatible TEMPLATE_META ---------- */

export const TEMPLATE_META = TEMPLATE_CATALOG.map((t) => ({
  id: t.id,
  name: t.name,
  desc: t.description,
  icon: getCategoryIcon(t.category),
}));

/* ---------- main exports ---------- */

export function getTemplateElements(templateId: string): RawEl[] {
  const template = TEMPLATE_CATALOG.find((t) => t.id === templateId);
  if (!template || template.zones.length === 0) return [];

  const allElements: RawEl[] = [];
  let currentY = 50;
  const ox = 50;

  for (const zone of template.zones) {
    const result = generateZone(zone, ox, currentY);
    allElements.push(...result.elements);
    currentY += result.height + 40;
  }

  return allElements;
}

export function getTemplateChairs(templateId: string): RawEl[] {
  const template = TEMPLATE_CATALOG.find((t) => t.id === templateId);
  if (!template || template.zones.length === 0) return [];

  const allChairs: RawEl[] = [];
  let currentY = 50;
  const ox = 50;

  for (const zone of template.zones) {
    const result = generateZone(zone, ox, currentY);
    allChairs.push(...result.chairs);
    currentY += result.height + 40;
  }

  return allChairs;
}
