import type { FloorPlanConfig, RoomDef, DoorDef, WindowDef, DecorationDef } from './types';
import { ROOM_DEFAULTS } from './types';
import { getPatternDefs, getPatternId } from './svgPatterns';

// ── Main generator ──

export function generateFloorPlanSVG(config: FloorPlanConfig): string {
  const { width, height } = config;
  const parts: string[] = [];

  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
  parts.push(getPatternDefs());
  parts.push(renderBackground(config));
  parts.push(renderRoomFloors(config));
  parts.push(renderWalls(config));
  parts.push(renderDoors(config));
  parts.push(renderWindows(config));
  parts.push(renderDecorations(config));
  parts.push(renderLabels(config));
  parts.push('</svg>');

  return parts.join('\n');
}

// ── Background ──

function renderBackground(config: FloorPlanConfig): string {
  const { width, height, backgroundColor } = config;
  const lines: string[] = [];
  lines.push(`  <!-- Floor background -->`);
  lines.push(`  <rect width="${width}" height="${height}" fill="${backgroundColor}"/>`);
  // Subtle base pattern (very light, won't overpower room colors)
  lines.push(`  <rect width="${width}" height="${height}" fill="url(#pat-wood)" opacity="0.3"/>`);
  return lines.join('\n');
}

// ── Room floors ──

function renderRoomFloors(config: FloorPlanConfig): string {
  const lines: string[] = [];
  lines.push(`  <!-- Room floors -->`);

  for (const room of config.rooms) {
    const defaults = ROOM_DEFAULTS[room.type];
    const color = room.floorColor || defaults.color;
    const pattern = room.floorPattern || defaults.pattern;
    const patId = getPatternId(pattern, room.type);

    lines.push(`  <g>`);
    // Solid floor color
    lines.push(`    <rect x="${room.x}" y="${room.y}" width="${room.width}" height="${room.height}" fill="${color}"/>`);
    // Pattern overlay
    lines.push(`    <rect x="${room.x}" y="${room.y}" width="${room.width}" height="${room.height}" fill="url(#${patId})"/>`);
    lines.push(`  </g>`);
  }

  return lines.join('\n');
}

// ── Walls ──

function renderWalls(config: FloorPlanConfig): string {
  const { width, height, exteriorWallThickness: ext, interiorWallThickness: int } = config;
  const pad = ext / 2;
  const lines: string[] = [];
  lines.push(`  <!-- Walls -->`);

  // Exterior walls
  lines.push(`  <rect x="${pad}" y="${pad}" width="${width - ext}" height="${height - ext}" fill="none" stroke="#8b7355" stroke-width="${ext}" rx="4"/>`);

  // Interior walls — derived from room edges that are not on the exterior
  const wallSegments = computeInteriorWalls(config);
  for (const seg of wallSegments) {
    lines.push(`  <line x1="${seg.x1}" y1="${seg.y1}" x2="${seg.x2}" y2="${seg.y2}" stroke="#8b7355" stroke-width="${int}"/>`);
  }

  return lines.join('\n');
}

interface WallSegment { x1: number; y1: number; x2: number; y2: number }

function computeInteriorWalls(config: FloorPlanConfig): WallSegment[] {
  const { width, height, exteriorWallThickness: ext } = config;
  const pad = ext;
  const segments: WallSegment[] = [];

  // Collect all openings and doors from all rooms, keyed by edge
  const edgeGaps = new Map<string, { position: number; width: number }[]>();

  for (const room of config.rooms) {
    const edges = getRoomEdges(room);
    for (let wallIdx = 0; wallIdx < edges.length; wallIdx++) {
      const edge = edges[wallIdx];
      const key = edgeKey(edge);
      const keyR = edgeKeyRev(edge);
      const gapKey = edgeGaps.has(key) ? key : edgeGaps.has(keyR) ? keyR : key;
      if (!edgeGaps.has(gapKey)) edgeGaps.set(gapKey, []);
      const gaps = edgeGaps.get(gapKey)!;

      // Add openings as gaps
      for (const op of room.openings || []) {
        if (op.wall === wallIdx) {
          gaps.push({ position: op.position, width: op.width || 80 });
        }
      }
      // Add doors as gaps
      for (const door of room.doors || []) {
        if (door.wall === wallIdx) {
          gaps.push({ position: door.position, width: door.width || 60 });
        }
      }
    }
  }

  const seen = new Set<string>();

  for (const room of config.rooms) {
    const edges = getRoomEdges(room);

    for (let wallIdx = 0; wallIdx < edges.length; wallIdx++) {
      const edge = edges[wallIdx];
      // Skip edges on the exterior boundary
      if (isExteriorEdge(edge, width, height, pad)) continue;
      // Dedup shared edges
      const key = edgeKey(edge);
      const keyR = edgeKeyRev(edge);
      if (seen.has(key) || seen.has(keyR)) continue;
      seen.add(key);

      // Collect all gaps on this edge (openings + doors from any room)
      const gapKey = edgeGaps.has(key) ? key : edgeGaps.has(keyR) ? keyR : null;
      const gaps = gapKey ? edgeGaps.get(gapKey)! : [];

      if (gaps.length === 0) {
        segments.push(edge);
      } else {
        segments.push(...splitWallAroundGaps(edge, gaps));
      }
    }
  }

  return segments;
}

function getRoomEdges(room: RoomDef): WallSegment[] {
  return [
    { x1: room.x, y1: room.y, x2: room.x + room.width, y2: room.y },
    { x1: room.x + room.width, y1: room.y, x2: room.x + room.width, y2: room.y + room.height },
    { x1: room.x, y1: room.y + room.height, x2: room.x + room.width, y2: room.y + room.height },
    { x1: room.x, y1: room.y, x2: room.x, y2: room.y + room.height },
  ];
}

function edgeKey(edge: WallSegment): string {
  return `${Math.round(edge.x1)},${Math.round(edge.y1)}-${Math.round(edge.x2)},${Math.round(edge.y2)}`;
}
function edgeKeyRev(edge: WallSegment): string {
  return `${Math.round(edge.x2)},${Math.round(edge.y2)}-${Math.round(edge.x1)},${Math.round(edge.y1)}`;
}

function isExteriorEdge(edge: WallSegment, w: number, h: number, pad: number): boolean {
  const margin = pad + 2;
  // Top edge
  if (Math.abs(edge.y1 - pad) < margin && Math.abs(edge.y2 - pad) < margin) return true;
  // Bottom edge
  if (Math.abs(edge.y1 - (h - pad)) < margin && Math.abs(edge.y2 - (h - pad)) < margin) return true;
  // Left edge
  if (Math.abs(edge.x1 - pad) < margin && Math.abs(edge.x2 - pad) < margin) return true;
  // Right edge
  if (Math.abs(edge.x1 - (w - pad)) < margin && Math.abs(edge.x2 - (w - pad)) < margin) return true;
  return false;
}

// (getDoorsOnEdge / getWallIndex removed — gaps are now pre-collected in computeInteriorWalls)

function splitWallAroundGaps(edge: WallSegment, gapDefs: { position: number; width: number }[]): WallSegment[] {
  const isHorizontal = Math.abs(edge.y1 - edge.y2) < 2;
  const length = isHorizontal
    ? Math.abs(edge.x2 - edge.x1)
    : Math.abs(edge.y2 - edge.y1);

  // Calculate gap positions along the wall
  const gaps: { start: number; end: number }[] = gapDefs.map(d => {
    const w = d.width;
    const center = d.position * length;
    return { start: center - w / 2, end: center + w / 2 };
  }).sort((a, b) => a.start - b.start);

  const segments: WallSegment[] = [];
  let cursor = 0;

  for (const gap of gaps) {
    if (gap.start > cursor) {
      if (isHorizontal) {
        const startX = Math.min(edge.x1, edge.x2);
        segments.push({
          x1: startX + cursor, y1: edge.y1,
          x2: startX + gap.start, y2: edge.y2,
        });
      } else {
        const startY = Math.min(edge.y1, edge.y2);
        segments.push({
          x1: edge.x1, y1: startY + cursor,
          x2: edge.x2, y2: startY + gap.start,
        });
      }
    }
    cursor = gap.end;
  }

  // Remainder after last gap
  if (cursor < length) {
    if (isHorizontal) {
      const startX = Math.min(edge.x1, edge.x2);
      segments.push({
        x1: startX + cursor, y1: edge.y1,
        x2: startX + length, y2: edge.y2,
      });
    } else {
      const startY = Math.min(edge.y1, edge.y2);
      segments.push({
        x1: edge.x1, y1: startY + cursor,
        x2: edge.x2, y2: startY + length,
      });
    }
  }

  return segments;
}

// ── Doors ──

function renderDoors(config: FloorPlanConfig): string {
  const lines: string[] = [];
  lines.push(`  <!-- Doors -->`);

  for (const room of config.rooms) {
    for (const door of room.doors) {
      lines.push(renderSingleDoor(room, door));
    }
  }

  return lines.join('\n');
}

// Render a realistic swing door: gap in wall + arc + door leaf line
function renderSingleDoor(room: RoomDef, door: DoorDef): string {
  const w = door.width || 60;
  const { x, y, width, height } = room;
  const parts: string[] = [];
  const bgColor = room.floorColor || ROOM_DEFAULTS[room.type]?.color || '#f5f0e8';

  // Door hinge position and swing direction
  switch (door.wall) {
    case 0: { // top wall — door opens inward (downward)
      const cx = x + door.position * width - w / 2; // left edge of opening
      const cy = y;
      // Gap background (clear the wall)
      parts.push(`  <rect x="${cx}" y="${cy - 4}" width="${w}" height="8" fill="${bgColor}"/>`);
      // Door leaf (line from hinge)
      parts.push(`  <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy + w * 0.7}" stroke="#8b6914" stroke-width="2.5" stroke-linecap="round"/>`);
      // Arc (quarter circle)
      parts.push(`  <path d="M ${cx} ${cy + w * 0.7} A ${w * 0.7} ${w * 0.7} 0 0 1 ${cx + w * 0.7} ${cy}" stroke="#8b6914" stroke-width="1" fill="none" stroke-dasharray="3,3" opacity="0.5"/>`);
      break;
    }
    case 1: { // right wall — door opens inward (leftward)
      const cx = x + width;
      const cy = y + door.position * height - w / 2;
      parts.push(`  <rect x="${cx - 4}" y="${cy}" width="8" height="${w}" fill="${bgColor}"/>`);
      parts.push(`  <line x1="${cx}" y1="${cy}" x2="${cx - w * 0.7}" y2="${cy}" stroke="#8b6914" stroke-width="2.5" stroke-linecap="round"/>`);
      parts.push(`  <path d="M ${cx - w * 0.7} ${cy} A ${w * 0.7} ${w * 0.7} 0 0 1 ${cx} ${cy + w * 0.7}" stroke="#8b6914" stroke-width="1" fill="none" stroke-dasharray="3,3" opacity="0.5"/>`);
      break;
    }
    case 2: { // bottom wall — door opens inward (upward)
      const cx = x + door.position * width - w / 2;
      const cy = y + height;
      parts.push(`  <rect x="${cx}" y="${cy - 4}" width="${w}" height="8" fill="${bgColor}"/>`);
      parts.push(`  <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - w * 0.7}" stroke="#8b6914" stroke-width="2.5" stroke-linecap="round"/>`);
      parts.push(`  <path d="M ${cx} ${cy - w * 0.7} A ${w * 0.7} ${w * 0.7} 0 0 0 ${cx + w * 0.7} ${cy}" stroke="#8b6914" stroke-width="1" fill="none" stroke-dasharray="3,3" opacity="0.5"/>`);
      break;
    }
    case 3: { // left wall — door opens inward (rightward)
      const cx = x;
      const cy = y + door.position * height - w / 2;
      parts.push(`  <rect x="${cx - 4}" y="${cy}" width="8" height="${w}" fill="${bgColor}"/>`);
      parts.push(`  <line x1="${cx}" y1="${cy}" x2="${cx + w * 0.7}" y2="${cy}" stroke="#8b6914" stroke-width="2.5" stroke-linecap="round"/>`);
      parts.push(`  <path d="M ${cx + w * 0.7} ${cy} A ${w * 0.7} ${w * 0.7} 0 0 0 ${cx} ${cy + w * 0.7}" stroke="#8b6914" stroke-width="1" fill="none" stroke-dasharray="3,3" opacity="0.5"/>`);
      break;
    }
  }

  return parts.join('\n');
}

// ── Windows ──

function renderWindows(config: FloorPlanConfig): string {
  const { exteriorWallThickness: ext } = config;
  const lines: string[] = [];
  lines.push(`  <!-- Windows -->`);

  for (const room of config.rooms) {
    for (const win of room.windows) {
      const pos = getWindowPosition(room, win, config.width, config.height, ext);
      if (pos) {
        lines.push(`  <rect x="${pos.x}" y="${pos.y}" width="${pos.w}" height="${pos.h}" fill="#87ceeb" opacity="0.6" rx="2"/>`);
      }
    }
  }

  return lines.join('\n');
}

function getWindowPosition(room: RoomDef, win: WindowDef, floorW: number, floorH: number, ext: number) {
  const w = win.width || 100;
  const { x, y, width, height } = room;

  switch (win.wall) {
    case 0: // top — only if room touches top exterior
      if (y <= ext + 2) return { x: x + win.position * width - w / 2, y: ext / 2, w, h: ext };
      return null;
    case 1: // right — only if room touches right exterior
      if (x + width >= floorW - ext - 2) return { x: floorW - ext, y: y + win.position * height - w / 2, w: ext, h: w };
      return null;
    case 2: // bottom
      if (y + height >= floorH - ext - 2) return { x: x + win.position * width - w / 2, y: floorH - ext, w, h: ext };
      return null;
    case 3: // left
      if (x <= ext + 2) return { x: 0, y: y + win.position * height - w / 2, w: ext, h: w };
      return null;
  }
}

// ── Decorations ──

function renderDecorations(config: FloorPlanConfig): string {
  const lines: string[] = [];
  lines.push(`  <!-- Decorations -->`);

  for (const dec of config.decorations) {
    const size = dec.size || 1;
    switch (dec.type) {
      case 'plant':
        lines.push(`  <circle cx="${dec.x}" cy="${dec.y}" r="${12 * size}" fill="#6b8e5a" opacity="0.3"/>`);
        break;
      case 'rug':
        lines.push(`  <rect x="${dec.x - 60 * size}" y="${dec.y - 30 * size}" width="${120 * size}" height="${60 * size}" fill="#d4a76a" opacity="0.1" rx="8"/>`);
        break;
      case 'column':
        lines.push(`  <rect x="${dec.x - 5 * size}" y="${dec.y - 5 * size}" width="${10 * size}" height="${10 * size}" fill="#8b7355" opacity="0.4" rx="2"/>`);
        break;
    }
  }

  return lines.join('\n');
}

// ── Labels ──

function renderLabels(config: FloorPlanConfig): string {
  const lines: string[] = [];
  lines.push(`  <!-- Room labels -->`);

  for (const room of config.rooms) {
    if (room.showLabel === false) continue;
    const cx = room.x + room.width / 2;
    const cy = room.y + 25;
    lines.push(`  <text x="${cx}" y="${cy}" font-family="sans-serif" font-size="14" fill="#8b7355" opacity="0.5" text-anchor="middle">${escapeXml(room.name)}</text>`);
  }

  return lines.join('\n');
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Utility: Convert SVG string to data URL ──

export function svgToDataURL(svg: string): string {
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}
