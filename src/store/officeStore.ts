import { create } from 'zustand';
import { FloorPlan, User, ViewMode, EditorMode, Camera, Furniture, Room, FurnitureType, RoomType } from '@/types';
import { defaultFloorPlan, mockUsers } from '@/data/floorPlan';

// LEGACY: The floorPlan/rooms/furniture data below was used by the old Konva/Canvas
// renderer. It is no longer consumed by the Excalidraw-based canvas but is kept for
// now to avoid breaking any remaining references. Consider removing once the migration
// is fully verified.

interface OfficeState {
  floorPlan: FloorPlan;
  users: User[];
  currentUser: User;
  viewMode: ViewMode;
  editorMode: EditorMode;
  camera: Camera;
  selectedFurnitureId: string | null;
  selectedRoomId: string | null;
  draggingItem: { type: 'furniture' | 'room'; id: string } | null;
  showGrid: boolean;
  showAvatarSelector: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  excalidrawAPI: any | null;

  setViewMode: (mode: ViewMode) => void;
  setEditorMode: (mode: EditorMode) => void;
  setCamera: (camera: Partial<Camera>) => void;
  moveCurrentUser: (x: number, y: number) => void;
  setCurrentUserStatus: (status: User['status']) => void;

  // Editor actions
  addRoom: (room: Room) => void;
  updateRoom: (id: string, updates: Partial<Room>) => void;
  removeRoom: (id: string) => void;
  addFurniture: (furniture: Furniture) => void;
  updateFurniture: (id: string, updates: Partial<Furniture>) => void;
  removeFurniture: (id: string) => void;
  selectFurniture: (id: string | null) => void;
  selectRoom: (id: string | null) => void;
  setDraggingItem: (item: { type: 'furniture' | 'room'; id: string } | null) => void;
  setShowGrid: (show: boolean) => void;
  setShowAvatarSelector: (show: boolean) => void;
  setCurrentUserAvatar: (style: string, seed: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setExcalidrawAPI: (api: any) => void;
  exportFloorPlan: () => string;
  importFloorPlan: (json: string) => void;

  // Palette drag
  addFurnitureFromPalette: (type: FurnitureType, x: number, y: number) => void;
  addRoomFromPalette: (type: RoomType, x: number, y: number) => void;
}

let furnitureIdCounter = 100;
let roomIdCounter = 100;

export const useOfficeStore = create<OfficeState>((set, get) => ({
  floorPlan: defaultFloorPlan,
  users: mockUsers,
  currentUser: {
    id: 'current',
    name: '斎藤優',
    role: 'エンジニア',
    avatarColor: '#4F46E5',
    initials: '斎',
    status: 'online',
    position: { x: 680, y: 180 },
    avatarStyle: 'notionists',
    avatarSeed: '斎藤優',
  },
  viewMode: 'floor',
  editorMode: 'view',
  camera: { x: 0, y: 0, zoom: 1 },
  selectedFurnitureId: null,
  selectedRoomId: null,
  draggingItem: null,
  showGrid: true,
  showAvatarSelector: false,
  excalidrawAPI: null,

  setViewMode: (mode) => set({ viewMode: mode }),
  setEditorMode: (mode) => set({ editorMode: mode, selectedFurnitureId: null, selectedRoomId: null }),
  setCamera: (camera) => set((state) => ({ camera: { ...state.camera, ...camera } })),

  moveCurrentUser: (x, y) =>
    set((state) => ({
      currentUser: { ...state.currentUser, targetPosition: { x, y } },
    })),

  setCurrentUserStatus: (status) =>
    set((state) => ({
      currentUser: { ...state.currentUser, status },
    })),

  addRoom: (room) =>
    set((state) => ({
      floorPlan: { ...state.floorPlan, rooms: [...state.floorPlan.rooms, room] },
    })),

  updateRoom: (id, updates) =>
    set((state) => ({
      floorPlan: {
        ...state.floorPlan,
        rooms: state.floorPlan.rooms.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      },
    })),

  removeRoom: (id) =>
    set((state) => {
      const room = state.floorPlan.rooms.find(r => r.id === id);
      return {
        floorPlan: {
          ...state.floorPlan,
          rooms: state.floorPlan.rooms.filter((r) => r.id !== id),
          // Remove furniture by roomId OR by position inside the room
          furniture: state.floorPlan.furniture.filter((f) => {
            if (f.roomId === id) return false;
            if (room && f.x >= room.x && f.x <= room.x + room.w && f.y >= room.y && f.y <= room.y + room.h) return false;
            return true;
          }),
        },
        selectedRoomId: null,
      };
    }),

  addFurniture: (furniture) =>
    set((state) => ({
      floorPlan: { ...state.floorPlan, furniture: [...state.floorPlan.furniture, furniture] },
    })),

  updateFurniture: (id, updates) =>
    set((state) => ({
      floorPlan: {
        ...state.floorPlan,
        furniture: state.floorPlan.furniture.map((f) => (f.id === id ? { ...f, ...updates } : f)),
      },
    })),

  removeFurniture: (id) =>
    set((state) => ({
      floorPlan: {
        ...state.floorPlan,
        furniture: state.floorPlan.furniture.filter((f) => f.id !== id),
      },
    })),

  selectFurniture: (id) => set({ selectedFurnitureId: id, selectedRoomId: null }),
  selectRoom: (id) => set({ selectedRoomId: id, selectedFurnitureId: null }),
  setDraggingItem: (item) => set({ draggingItem: item }),
  setShowGrid: (show) => set({ showGrid: show }),
  setShowAvatarSelector: (show) => set({ showAvatarSelector: show }),
  setCurrentUserAvatar: (style, seed) =>
    set((state) => ({
      currentUser: { ...state.currentUser, avatarStyle: style, avatarSeed: seed },
    })),

  setExcalidrawAPI: (api) => set({ excalidrawAPI: api }),

  exportFloorPlan: () => {
    const { floorPlan } = get();
    return JSON.stringify(floorPlan, null, 2);
  },

  importFloorPlan: (json) => {
    try {
      const plan = JSON.parse(json) as FloorPlan;
      set({ floorPlan: plan });
    } catch {
      console.error('Invalid floor plan JSON');
    }
  },

  addFurnitureFromPalette: (type, x, y) => {
    const sizes: Record<FurnitureType, { w: number; h: number }> = {
      desk: { w: 60, h: 30 },
      chair: { w: 20, h: 20 },
      sofa: { w: 80, h: 35 },
      table: { w: 50, h: 50 },
      plant: { w: 20, h: 20 },
      printer: { w: 30, h: 30 },
      bookshelf: { w: 60, h: 15 },
      whiteboard: { w: 70, h: 5 },
      monitor: { w: 25, h: 15 },
      'coffee-machine': { w: 25, h: 25 },
      partition: { w: 5, h: 80 },
    };
    const size = sizes[type];
    const id = `f-${++furnitureIdCounter}`;
    set((state) => ({
      floorPlan: {
        ...state.floorPlan,
        furniture: [...state.floorPlan.furniture, { id, type, x, y, ...size }],
      },
      selectedFurnitureId: id,
    }));
  },

  addRoomFromPalette: (type, x, y) => {
    const names: Record<RoomType, string> = {
      workspace: 'Workspace',
      meeting: 'Meeting Room',
      lounge: 'Lounge',
      cafe: 'Café',
      open: 'Open Area',
    };
    const colors: Record<RoomType, string> = {
      workspace: '#F0F4FF',
      meeting: '#F0FDF4',
      lounge: '#FFF7ED',
      cafe: '#FDF2F8',
      open: '#F5F5F5',
    };
    const id = `r-${++roomIdCounter}`;
    set((state) => ({
      floorPlan: {
        ...state.floorPlan,
        rooms: [
          ...state.floorPlan.rooms,
          { id, type, name: names[type], x, y, w: 200, h: 150, color: colors[type] },
        ],
      },
      selectedRoomId: id,
    }));
  },
}));
