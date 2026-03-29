import { create } from 'zustand';
import { FloorPlan, User, ViewMode, EditorMode, Camera, Furniture, Room, FurnitureType, RoomType, Zone, UserAction, PresenceStatus } from '@/types';

interface ChatMessage {
  userId: string;
  text: string;
  timestamp: number;
}

export interface Notification {
  id: string;
  text: string;
  timestamp: number;
}

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
  chatMessages: ChatMessage[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  excalidrawAPI: any | null;
  excalidrawAppState: any | null;
  setExcalidrawAppState: (state: any) => void;

  // Seat/Zone system
  zones: Zone[];
  currentAction: UserAction;
  currentSeatId: string | null;

  // Notifications
  notifications: Notification[];
  addNotification: (text: string) => void;
  removeNotification: (id: string) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // WebSocket
  wsConnected: boolean;
  setWsConnected: (connected: boolean) => void;
  addRemoteUser: (user: User) => void;
  removeRemoteUser: (userId: string) => void;
  updateRemoteUserPosition: (userId: string, x: number, y: number) => void;
  updateRemoteUserSeat: (userId: string, seatId: string, x: number, y: number) => void;
  updateRemoteUserStand: (userId: string) => void;
  addChatMessage: (userId: string, text: string, timestamp?: number) => void;
  updateRemoteUserStatus: (userId: string, status: PresenceStatus) => void;
  setRemoteUsers: (users: User[]) => void;

  setViewMode: (mode: ViewMode) => void;
  setEditorMode: (mode: EditorMode) => void;
  setCamera: (camera: Partial<Camera>) => void;
  moveCurrentUser: (x: number, y: number) => void;
  setCurrentUserStatus: (status: User['status']) => void;
  sendMessage: (text: string) => void;

  // Seat/Zone actions
  setZones: (zones: Zone[]) => void;
  sitAt: (seatId: string) => void;
  standUp: () => void;
  setCurrentAction: (action: UserAction) => void;

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
  floorPlan: { id: '', name: '', width: 800, height: 600, gridSize: 20, rooms: [], furniture: [] },
  users: [], // Real users come via WebSocket
  currentUser: {
    id: 'pending', // Will be set by WebSocket welcome message
    name: 'ゲスト',
    role: 'メンバー',
    avatarColor: '#4F46E5',
    initials: 'G',
    status: 'online',
    position: { x: 200, y: 200 },
    avatarStyle: 'notionists',
    avatarSeed: 'default',
  },
  viewMode: 'floor',
  editorMode: 'view',
  camera: { x: 0, y: 0, zoom: 1 },
  selectedFurnitureId: null,
  selectedRoomId: null,
  draggingItem: null,
  showGrid: true,
  showAvatarSelector: false,
  chatMessages: [],
  excalidrawAPI: null,
  excalidrawAppState: null,
  setExcalidrawAppState: (state) => set({ excalidrawAppState: state }),

  // Search
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Seat/Zone system
  zones: [],
  currentAction: 'idle',
  currentSeatId: null,

  // Notifications
  notifications: [],
  addNotification: (text) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((state) => ({
      notifications: [...state.notifications.slice(-2), { id, text, timestamp: Date.now() }],
    }));
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    }, 5000);
  },
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  // WebSocket state & actions
  wsConnected: false,
  setWsConnected: (connected) => set({ wsConnected: connected }),

  setRemoteUsers: (users) => set({ users }),

  addRemoteUser: (user) =>
    set((state) => {
      if (state.users.find((u) => u.id === user.id)) return state;
      return { users: [...state.users, user] };
    }),

  removeRemoteUser: (userId) =>
    set((state) => ({
      users: state.users.filter((u) => u.id !== userId),
    })),

  updateRemoteUserPosition: (userId, x, y) =>
    set((state) => ({
      users: state.users.map((u) =>
        u.id === userId ? { ...u, position: { x, y }, targetPosition: { x, y } } : u,
      ),
    })),

  updateRemoteUserSeat: (userId, seatId, x, y) =>
    set((state) => ({
      users: state.users.map((u) =>
        u.id === userId ? { ...u, position: { x, y }, targetPosition: { x, y } } : u,
      ),
      zones: state.zones.map((zone) => ({
        ...zone,
        seats: zone.seats.map((s) =>
          s.id === seatId ? { ...s, occupied: true, occupiedBy: userId } : s,
        ),
      })),
    })),

  updateRemoteUserStand: (userId) =>
    set((state) => ({
      zones: state.zones.map((zone) => ({
        ...zone,
        seats: zone.seats.map((s) =>
          s.occupiedBy === userId ? { ...s, occupied: false, occupiedBy: undefined } : s,
        ),
      })),
    })),

  addChatMessage: (userId, text, timestamp) =>
    set((state) => ({
      chatMessages: [
        ...state.chatMessages.filter((m) => Date.now() - m.timestamp < 30000),
        { userId, text, timestamp: timestamp || Date.now() },
      ],
    })),

  updateRemoteUserStatus: (userId, status) =>
    set((state) => ({
      users: state.users.map((u) =>
        u.id === userId ? { ...u, status } : u,
      ),
    })),

  setViewMode: (mode) => set({ viewMode: mode }),
  setEditorMode: (mode) => set({ editorMode: mode, selectedFurnitureId: null, selectedRoomId: null }),
  setCamera: (camera) => set((state) => ({ camera: { ...state.camera, ...camera } })),

  moveCurrentUser: (x, y) =>
    set((state) => ({
      currentUser: { ...state.currentUser, position: { x, y }, targetPosition: { x, y } },
    })),

  setCurrentUserStatus: (status) =>
    set((state) => ({
      currentUser: { ...state.currentUser, status },
    })),

  sendMessage: (text) => {
    const state = get();
    state.addNotification(`${state.currentUser.name}: ${text}`);
    set((s) => ({
      chatMessages: [
        ...s.chatMessages.filter((m) => Date.now() - m.timestamp < 10000),
        { userId: s.currentUser.id, text, timestamp: Date.now() },
      ],
    }));
  },

  // Seat/Zone actions
  setZones: (zones) => set({ zones }),
  sitAt: (seatId) =>
    set((state) => {
      // Find the seat and its zone
      let targetSeat: Zone['seats'][0] | null = null;
      let targetZone: Zone | null = null;
      for (const zone of state.zones) {
        const seat = zone.seats.find((s) => s.id === seatId);
        if (seat) {
          targetSeat = seat;
          targetZone = zone;
          break;
        }
      }
      if (!targetSeat || !targetZone || targetSeat.occupied) return state;

      // Determine action based on zone type
      const actionMap: Record<Zone['type'], UserAction> = {
        desk: 'working',
        meeting: 'meeting',
        lounge: 'break',
        cafe: 'break',
        open: 'idle',
      };

      // First vacate current seat if any
      const zones = state.zones.map((zone) => ({
        ...zone,
        seats: zone.seats.map((s) => {
          if (s.id === state.currentSeatId) {
            return { ...s, occupied: false, occupiedBy: undefined };
          }
          if (s.id === seatId) {
            return { ...s, occupied: true, occupiedBy: state.currentUser.id };
          }
          return s;
        }),
      }));

      // Fire notification for meeting rooms
      if (targetZone.type === 'meeting') {
        setTimeout(() => {
          get().addNotification(`${state.currentUser.name}が${targetZone!.name}に参加しました`);
        }, 0);
      }

      return {
        zones,
        currentSeatId: seatId,
        currentAction: actionMap[targetZone.type],
        currentUser: {
          ...state.currentUser,
          position: { x: targetSeat.x, y: targetSeat.y },
          targetPosition: { x: targetSeat.x, y: targetSeat.y },
        },
      };
    }),

  standUp: () =>
    set((state) => {
      if (!state.currentSeatId) return state;
      const zones = state.zones.map((zone) => ({
        ...zone,
        seats: zone.seats.map((s) =>
          s.id === state.currentSeatId
            ? { ...s, occupied: false, occupiedBy: undefined }
            : s,
        ),
      }));
      return {
        zones,
        currentSeatId: null,
        currentAction: 'idle',
      };
    }),

  setCurrentAction: (action) => set({ currentAction: action }),

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
