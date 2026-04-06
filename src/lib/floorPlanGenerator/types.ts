export type FloorRoomType = 'workspace' | 'meeting' | 'executive' | 'open-area' | 'break-room' | 'reception' | 'cafe';
export type FloorPattern = 'wood' | 'tile' | 'carpet' | 'marble' | 'concrete';
export type FloorStyle = 'modern' | 'traditional' | 'industrial' | 'natural';

export interface DoorDef {
  wall: 0 | 1 | 2 | 3; // 0=top, 1=right, 2=bottom, 3=left
  position: number;      // 0-1 fraction along the wall
  width?: number;        // default 60
}

export interface WindowDef {
  wall: 0 | 1 | 2 | 3;
  position: number;
  width?: number;        // default 100
}

export interface RoomDef {
  id: string;
  type: FloorRoomType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  floorPattern?: FloorPattern;
  floorColor?: string;
  doors: DoorDef[];
  windows: WindowDef[];
  showLabel?: boolean;
  openings?: { wall: 0|1|2|3; position: number; width?: number }[]; // partial wall openings at specific positions
}

export interface DecorationDef {
  type: 'plant' | 'rug' | 'column';
  x: number;
  y: number;
  size?: number;
}

export interface FloorPlanConfig {
  width: number;
  height: number;
  style: FloorStyle;
  backgroundColor: string;
  exteriorWallThickness: number;
  interiorWallThickness: number;
  rooms: RoomDef[];
  decorations: DecorationDef[];
}

// Room type → default floor appearance
export const ROOM_DEFAULTS: Record<FloorRoomType, { pattern: FloorPattern; color: string }> = {
  'workspace':  { pattern: 'wood',     color: '#f5f0e8' },
  'meeting':    { pattern: 'carpet',   color: '#e8edf5' },
  'executive':  { pattern: 'wood',     color: '#e8e0d4' },
  'open-area':  { pattern: 'concrete', color: '#f0ede8' },
  'break-room': { pattern: 'tile',     color: '#f0f5f0' },
  'reception':  { pattern: 'marble',   color: '#f5f3f0' },
  'cafe':       { pattern: 'wood',     color: '#f5ede0' },
};
