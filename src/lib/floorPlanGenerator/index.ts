export type { FloorPlanConfig, RoomDef, DoorDef, WindowDef, DecorationDef, FloorRoomType, FloorPattern, FloorStyle } from './types';
export { ROOM_DEFAULTS } from './types';
export { generateFloorPlanSVG, svgToDataURL } from './svgGenerator';
export { FLOOR_PLAN_PRESETS, PRESET_CATEGORIES } from './presets';
export type { FloorPlanPreset } from './presets';
export { autoLayoutRooms, buildConfigFromRequests, recommendFloorSize, ROOM_TYPE_NAMES } from './autoLayout';
