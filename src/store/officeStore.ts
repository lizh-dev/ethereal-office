import { create } from 'zustand';
import { FloorPlan, User, ViewMode, EditorMode, Camera, Furniture, Room, FurnitureType, RoomType, Zone, UserAction, PresenceStatus, DMMessage } from '@/types';
import type { PlanType, PlanPermissions } from '@/types/plan';
import { DEFAULT_PERMISSIONS } from '@/types/plan';
import type { FurnitureTheme } from '@/lib/furnitureAssets';

interface ChatMessage {
  userId: string;
  text: string;
  timestamp: number;
}

export interface WhisperMessage {
  userId: string;
  name: string;
  text: string;
  timestamp: number;
}

export interface ActivityItem {
  id: string;
  type: string;
  message: string;
  timestamp: number;
}

export interface ActiveMeetingState {
  id: string;
  name: string;
  createdBy: string;
  creatorName: string;
  hasPassword: boolean;
  participants: number;
  createdAt: number;
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
  autoVoiceEnabled: boolean;
  setAutoVoiceEnabled: (enabled: boolean) => void;
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

  // Reactions (userId -> emoji, auto-clears)
  reactions: Record<string, string>;

  // Custom status message
  statusMessage: string;
  setStatusMessage: (msg: string) => void;

  // DM
  dmMessages: Record<string, DMMessage[]>;
  dmUnreadCount: Record<string, number>;
  activeDMUserId: string | null;
  addDMMessage: (msg: DMMessage) => void;
  setActiveDM: (userId: string | null) => void;
  clearDMUnread: (userId: string) => void;

  // Chat unread tracking
  unreadChatCount: number;
  markChatRead: () => void;

  // Floor identity
  floorSlug: string;
  ownerEmail: string;
  setFloorIdentity: (slug: string, ownerEmail: string) => void;

  // Permissions
  isFloorOwner: boolean;
  setIsFloorOwner: (v: boolean) => void;

  // Plan-based RBAC
  floorPlanType: PlanType;
  planPermissions: PlanPermissions;
  setFloorPlanInfo: (plan: PlanType, permissions: PlanPermissions) => void;
  canUseFeature: (feature: keyof PlanPermissions) => boolean;

  // Furniture theme
  furnitureTheme: FurnitureTheme;
  setFurnitureTheme: (theme: FurnitureTheme) => void;

  // Custom branding
  branding: { logoUrl: string; accentColor: string; floorTitle: string };
  setBranding: (b: { logoUrl: string; accentColor: string; floorTitle: string }) => void;

  // Kick notification overlay
  kickedNotification: boolean;
  setKickedNotification: (v: boolean) => void;

  // Call request
  incomingCallRequest: { fromUserId: string; fromUserName: string } | null;
  callRequestStatus: 'idle' | 'pending' | 'accepted' | 'declined';
  callTargetUserId: string | null;
  setIncomingCallRequest: (req: { fromUserId: string; fromUserName: string } | null) => void;
  setCallRequestStatus: (status: 'idle' | 'pending' | 'accepted' | 'declined') => void;
  setCallTargetUserId: (userId: string | null) => void;
  clearCallRequest: () => void;
  pendingCallUrl: string | null;
  setPendingCallUrl: (url: string | null) => void;

  // Active meetings (shared across floor)
  activeMeetings: ActiveMeetingState[];
  myMeetingId: string | null;
  setActiveMeetings: (meetings: ActiveMeetingState[]) => void;
  addActiveMeeting: (meeting: ActiveMeetingState) => void;
  updateMeetingParticipants: (meetingId: string, participants: number) => void;
  removeMeeting: (meetingId: string) => void;
  setMyMeetingId: (id: string | null) => void;

  // Whisper (proximity chat)
  whisperMessages: WhisperMessage[];
  addWhisperMessage: (msg: WhisperMessage) => void;

  // Activity feed
  activityFeed: ActivityItem[];
  addActivity: (type: string, message: string) => void;

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
  updateRemoteUserStatus: (userId: string, status: PresenceStatus, statusMessage?: string) => void;
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
  autoVoiceEnabled: typeof window !== 'undefined' ? localStorage.getItem('ethereal-auto-voice') !== 'false' : true,
  chatMessages: [],
  excalidrawAPI: null,
  excalidrawAppState: null,
  setExcalidrawAppState: (state) => set({ excalidrawAppState: state }),

  // Custom status message
  statusMessage: '',
  setStatusMessage: (msg) =>
    set((state) => ({
      statusMessage: msg,
      currentUser: { ...state.currentUser, statusMessage: msg },
    })),

  // DM
  dmMessages: {},
  dmUnreadCount: {},
  activeDMUserId: null,
  addDMMessage: (msg) =>
    set((state) => {
      const otherUserId = msg.from === state.currentUser.id ? msg.to : msg.from;
      const existing = state.dmMessages[otherUserId] || [];
      const dmUnreadCount = { ...state.dmUnreadCount };
      // Increment unread if the DM panel for this user is not open and the message is from someone else
      if (state.activeDMUserId !== otherUserId && msg.from !== state.currentUser.id) {
        dmUnreadCount[otherUserId] = (dmUnreadCount[otherUserId] || 0) + 1;
      }
      return {
        dmMessages: {
          ...state.dmMessages,
          [otherUserId]: [...existing, msg],
        },
        dmUnreadCount,
      };
    }),
  setActiveDM: (userId) =>
    set((state) => {
      if (userId) {
        const dmUnreadCount = { ...state.dmUnreadCount };
        dmUnreadCount[userId] = 0;
        return { activeDMUserId: userId, dmUnreadCount };
      }
      return { activeDMUserId: null };
    }),
  clearDMUnread: (userId) =>
    set((state) => ({
      dmUnreadCount: { ...state.dmUnreadCount, [userId]: 0 },
    })),

  // Reactions
  reactions: {},

  // Chat unread
  unreadChatCount: 0,
  markChatRead: () => set({ unreadChatCount: 0 }),

  // Floor identity
  floorSlug: '',
  ownerEmail: '',
  setFloorIdentity: (slug, ownerEmail) => set({ floorSlug: slug, ownerEmail }),

  // Permissions
  isFloorOwner: false,
  setIsFloorOwner: (v) => set({ isFloorOwner: v }),

  // Plan-based RBAC
  floorPlanType: 'free' as PlanType,
  planPermissions: DEFAULT_PERMISSIONS,
  setFloorPlanInfo: (plan, permissions) => set({ floorPlanType: plan, planPermissions: permissions }),
  canUseFeature: (feature) => {
    const perms = get().planPermissions;
    return !!perms[feature];
  },

  // Furniture theme
  furnitureTheme: 'standard' as FurnitureTheme,
  setFurnitureTheme: (theme) => set({ furnitureTheme: theme }),

  // Custom branding
  branding: { logoUrl: '', accentColor: '#0ea5e9', floorTitle: '' },
  setBranding: (b) => set({ branding: b }),

  // Kick notification overlay
  kickedNotification: false,
  setKickedNotification: (v) => set({ kickedNotification: v }),

  // Call request
  incomingCallRequest: null,
  callRequestStatus: 'idle',
  callTargetUserId: null,
  setIncomingCallRequest: (req) => set({ incomingCallRequest: req }),
  setCallRequestStatus: (status) => set({ callRequestStatus: status }),
  setCallTargetUserId: (userId) => set({ callTargetUserId: userId }),
  clearCallRequest: () => set({ incomingCallRequest: null, callRequestStatus: 'idle', callTargetUserId: null }),
  pendingCallUrl: null,
  setPendingCallUrl: (url) => set({ pendingCallUrl: url }),

  // Active meetings
  activeMeetings: [],
  myMeetingId: null,
  setActiveMeetings: (meetings) => set({ activeMeetings: meetings }),
  addActiveMeeting: (meeting) => set((s) => ({ activeMeetings: [...s.activeMeetings, meeting] })),
  updateMeetingParticipants: (meetingId, participants) => set((s) => ({
    activeMeetings: s.activeMeetings.map(m => m.id === meetingId ? { ...m, participants } : m),
  })),
  removeMeeting: (meetingId) => set((s) => ({
    activeMeetings: s.activeMeetings.filter(m => m.id !== meetingId),
    myMeetingId: s.myMeetingId === meetingId ? null : s.myMeetingId,
  })),
  setMyMeetingId: (id) => set({ myMeetingId: id }),

  // Whisper (proximity chat)
  whisperMessages: [],
  addWhisperMessage: (msg) => {
    set((state) => ({
      whisperMessages: [...state.whisperMessages, msg],
    }));
    // Auto-remove after 5 seconds
    setTimeout(() => {
      set((state) => ({
        whisperMessages: state.whisperMessages.filter((m) => m.timestamp !== msg.timestamp || m.userId !== msg.userId),
      }));
    }, 5000);
  },

  // Activity feed
  activityFeed: [],
  addActivity: (type, message) => {
    const id = `activity-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((state) => ({
      activityFeed: [...state.activityFeed.slice(-49), { id, type, message, timestamp: Date.now() }],
    }));
  },

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
      // Release any seats occupied by this user
      zones: state.zones.map((zone) => ({
        ...zone,
        seats: zone.seats.map((s) =>
          s.occupiedBy === userId ? { ...s, occupied: false, occupiedBy: undefined } : s,
        ),
      })),
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
        ...state.chatMessages,
        { userId, text, timestamp: timestamp || Date.now() },
      ],
      unreadChatCount: state.viewMode === 'chat' ? state.unreadChatCount : state.unreadChatCount + 1,
    })),

  updateRemoteUserStatus: (userId, status, statusMessage) =>
    set((state) => ({
      users: state.users.map((u) =>
        u.id === userId ? { ...u, status, statusMessage: statusMessage ?? u.statusMessage } : u,
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
        ...s.chatMessages,
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
  setAutoVoiceEnabled: (enabled) => {
    try { localStorage.setItem('ethereal-auto-voice', String(enabled)); } catch {}
    set({ autoVoiceEnabled: enabled });
  },
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
