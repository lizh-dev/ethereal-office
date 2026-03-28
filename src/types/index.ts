export type PresenceStatus = 'online' | 'busy' | 'focusing' | 'offline';

export type RoomType = 'workspace' | 'meeting' | 'lounge' | 'cafe' | 'open';

export type FurnitureType =
  | 'desk'
  | 'chair'
  | 'sofa'
  | 'table'
  | 'plant'
  | 'printer'
  | 'bookshelf'
  | 'whiteboard'
  | 'monitor'
  | 'coffee-machine'
  | 'partition';

export interface Point {
  x: number;
  y: number;
}

export interface Room {
  id: string;
  type: RoomType;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color?: string;
  wallColor?: string;
}

export interface Furniture {
  id: string;
  type: FurnitureType;
  roomId?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
}

export interface FloorPlan {
  id: string;
  name: string;
  width: number;
  height: number;
  gridSize: number;
  rooms: Room[];
  furniture: Furniture[];
}

export interface User {
  id: string;
  name: string;
  role?: string;
  avatarColor: string;
  initials: string;
  status: PresenceStatus;
  position: Point;
  targetPosition?: Point;
  avatarStyle?: string;
  avatarSeed?: string;
}

export type ViewMode = 'floor' | 'meetings' | 'chat' | 'profile';
export type EditorMode = 'view' | 'edit';

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}
