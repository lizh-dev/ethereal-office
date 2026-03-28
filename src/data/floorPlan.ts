import { FloorPlan, User, Zone } from '@/types';

export const defaultFloorPlan: FloorPlan = {
  id: 'ethereal-default',
  name: 'The Ethereal Office',
  width: 1100,
  height: 750,
  gridSize: 20,
  rooms: [
    { id: 'conference-a', type: 'meeting', name: '会議室 A', x: 30, y: 30, w: 250, h: 190, color: '#E8DFD4', wallColor: '#B8A898' },
    { id: 'quiet-room', type: 'meeting', name: '集中ルーム', x: 30, y: 240, w: 160, h: 140, color: '#E8DFD4', wallColor: '#B8A898' },
    { id: 'open-plan', type: 'workspace', name: 'オープンスペース', x: 210, y: 100, w: 440, h: 280, color: '#F0EAE0', wallColor: '#C8BCA8' },
    { id: 'ceo-suite', type: 'meeting', name: '役員室', x: 700, y: 30, w: 200, h: 160, color: '#E8DFD4', wallColor: '#B8A898' },
    { id: 'war-room', type: 'meeting', name: '戦略ルーム', x: 700, y: 210, w: 200, h: 170, color: '#E8DFD4', wallColor: '#B8A898' },
    { id: 'lounge', type: 'lounge', name: 'ラウンジ', x: 30, y: 420, w: 200, h: 160, color: '#DDD5C8', wallColor: '#B8A898' },
    { id: 'open-kitchen', type: 'cafe', name: 'カフェスペース', x: 370, y: 440, w: 280, h: 140, color: '#E0D8CC', wallColor: '#B8A898' },
    { id: 'brainstorm-1', type: 'meeting', name: 'ブレスト 1', x: 700, y: 410, w: 200, h: 170, color: '#E8DFD4', wallColor: '#B8A898' },
    { id: 'media-room', type: 'workspace', name: 'メディアルーム', x: 30, y: 600, w: 200, h: 130, color: '#E2DAD0', wallColor: '#B8A898' },
  ],
  furniture: [
    { id: 'ca-t', type: 'table', x: 80, y: 80, w: 130, h: 70 },
    ...Array.from({ length: 3 }, (_, i) => ({ id: `ca-c-t${i}`, type: 'chair' as const, x: 95 + i * 40, y: 65, w: 22, h: 22 })),
    ...Array.from({ length: 3 }, (_, i) => ({ id: `ca-c-b${i}`, type: 'chair' as const, x: 95 + i * 40, y: 155, w: 22, h: 22 })),
    { id: 'ca-wb', type: 'whiteboard' as const, x: 220, y: 60, w: 8, h: 80 },
    { id: 'ca-mon', type: 'monitor' as const, x: 45, y: 95, w: 25, h: 18 },
    { id: 'ca-p1', type: 'plant' as const, x: 240, y: 35, w: 28, h: 28 },
    { id: 'ca-p2', type: 'plant' as const, x: 35, y: 35, w: 28, h: 28 },
    { id: 'ceo-d', type: 'desk' as const, x: 730, y: 60, w: 90, h: 40 },
    { id: 'ceo-c', type: 'chair' as const, x: 765, y: 110, w: 24, h: 24 },
    { id: 'ceo-m1', type: 'monitor' as const, x: 740, y: 62, w: 28, h: 16 },
    { id: 'ceo-m2', type: 'monitor' as const, x: 785, y: 62, w: 28, h: 16 },
    { id: 'ceo-bs', type: 'bookshelf' as const, x: 840, y: 40, w: 50, h: 14 },
    { id: 'ceo-p1', type: 'plant' as const, x: 860, y: 55, w: 28, h: 28 },
    { id: 'ceo-p2', type: 'plant' as const, x: 860, y: 150, w: 28, h: 28 },
    { id: 'ceo-p3', type: 'plant' as const, x: 710, y: 150, w: 28, h: 28 },
    ...Array.from({ length: 8 }, (_, i) => ({ id: `op-d${i}`, type: 'desk' as const, x: 230 + (i % 4) * 100, y: 130 + Math.floor(i / 4) * 120, w: 75, h: 35 })),
    ...Array.from({ length: 8 }, (_, i) => ({ id: `op-c${i}`, type: 'chair' as const, x: 255 + (i % 4) * 100, y: 170 + Math.floor(i / 4) * 120, w: 22, h: 22 })),
    ...Array.from({ length: 8 }, (_, i) => ({ id: `op-m${i}`, type: 'monitor' as const, x: 245 + (i % 4) * 100, y: 132 + Math.floor(i / 4) * 120, w: 24, h: 14 })),
    { id: 'op-p1', type: 'plant' as const, x: 220, y: 105, w: 26, h: 26 },
    { id: 'op-p2', type: 'plant' as const, x: 620, y: 105, w: 26, h: 26 },
    { id: 'op-p3', type: 'plant' as const, x: 620, y: 350, w: 26, h: 26 },
    { id: 'qr-d1', type: 'desk' as const, x: 50, y: 260, w: 60, h: 30 },
    { id: 'qr-c1', type: 'chair' as const, x: 70, y: 295, w: 22, h: 22 },
    { id: 'qr-d2', type: 'desk' as const, x: 120, y: 260, w: 60, h: 30 },
    { id: 'qr-c2', type: 'chair' as const, x: 140, y: 295, w: 22, h: 22 },
    { id: 'qr-p1', type: 'plant' as const, x: 40, y: 340, w: 26, h: 26 },
    { id: 'wr-t', type: 'table' as const, x: 740, y: 260, w: 120, h: 60 },
    ...Array.from({ length: 3 }, (_, i) => ({ id: `wr-c-t${i}`, type: 'chair' as const, x: 755 + i * 35, y: 245, w: 22, h: 22 })),
    ...Array.from({ length: 3 }, (_, i) => ({ id: `wr-c-b${i}`, type: 'chair' as const, x: 755 + i * 35, y: 325, w: 22, h: 22 })),
    { id: 'wr-wb', type: 'whiteboard' as const, x: 870, y: 250, w: 8, h: 70 },
    { id: 'l-s1', type: 'sofa' as const, x: 50, y: 450, w: 90, h: 40 },
    { id: 'l-s2', type: 'sofa' as const, x: 50, y: 530, w: 90, h: 40 },
    { id: 'l-tb', type: 'table' as const, x: 65, y: 497, w: 55, h: 28 },
    { id: 'l-p1', type: 'plant' as const, x: 160, y: 435, w: 28, h: 28 },
    { id: 'l-p2', type: 'plant' as const, x: 190, y: 540, w: 28, h: 28 },
    { id: 'ok-t1', type: 'table' as const, x: 400, y: 475, w: 55, h: 55 },
    { id: 'ok-t2', type: 'table' as const, x: 510, y: 475, w: 55, h: 55 },
    { id: 'ok-cm', type: 'coffee-machine' as const, x: 600, y: 455, w: 30, h: 30 },
    { id: 'ok-bs', type: 'bookshelf' as const, x: 380, y: 555, w: 80, h: 14 },
    ...Array.from({ length: 4 }, (_, i) => ({ id: `ok-c${i}`, type: 'chair' as const, x: 390 + (i % 2) * 25 + Math.floor(i / 2) * 110, y: 540, w: 20, h: 20 })),
    { id: 'bs-t', type: 'table' as const, x: 745, y: 460, w: 110, h: 60 },
    ...Array.from({ length: 3 }, (_, i) => ({ id: `bs-ct${i}`, type: 'chair' as const, x: 760 + i * 35, y: 445, w: 22, h: 22 })),
    ...Array.from({ length: 3 }, (_, i) => ({ id: `bs-cb${i}`, type: 'chair' as const, x: 760 + i * 35, y: 525, w: 22, h: 22 })),
    { id: 'bs-p1', type: 'plant' as const, x: 870, y: 425, w: 26, h: 26 },
    { id: 'mr-d1', type: 'desk' as const, x: 50, y: 625, w: 70, h: 35 },
    { id: 'mr-d2', type: 'desk' as const, x: 140, y: 625, w: 70, h: 35 },
    { id: 'mr-c1', type: 'chair' as const, x: 75, y: 665, w: 22, h: 22 },
    { id: 'mr-c2', type: 'chair' as const, x: 165, y: 665, w: 22, h: 22 },
    { id: 'mr-m1', type: 'monitor' as const, x: 55, y: 628, w: 28, h: 16 },
    { id: 'mr-m2', type: 'monitor' as const, x: 145, y: 628, w: 28, h: 16 },
    { id: 'pr-1', type: 'printer' as const, x: 660, y: 380, w: 30, h: 25 },
  ],
};

export const mockUsers: User[] = [
  { id: 'u1', name: '田中太郎', role: 'エンジニア', avatarColor: '#4F46E5', initials: '田', status: 'online', position: { x: 100, y: 100 }, avatarStyle: 'notionists', avatarSeed: 'tanaka-taro' },
  { id: 'u2', name: '鈴木花子', role: 'デザイナー', avatarColor: '#7C3AED', initials: '鈴', status: 'focusing', position: { x: 155, y: 100 }, avatarStyle: 'notionists', avatarSeed: 'suzuki-hanako' },
  { id: 'u3', name: '佐藤健一', role: 'PM', avatarColor: '#DC2626', initials: '佐', status: 'busy', position: { x: 130, y: 155 }, avatarStyle: 'notionists', avatarSeed: 'sato-kenichi' },
  { id: 'u4', name: '山田美咲', role: 'エンジニア', avatarColor: '#059669', initials: '山', status: 'online', position: { x: 330, y: 180 }, avatarStyle: 'notionists', avatarSeed: 'yamada-misaki' },
  { id: 'u5', name: '伊藤翔太', role: 'エンジニア', avatarColor: '#2563EB', initials: '伊', status: 'online', position: { x: 430, y: 180 }, avatarStyle: 'notionists', avatarSeed: 'ito-shota' },
  { id: 'u6', name: '渡辺愛', role: 'マーケティング', avatarColor: '#BE185D', initials: '渡', status: 'busy', position: { x: 530, y: 180 }, avatarStyle: 'notionists', avatarSeed: 'watanabe-ai' },
  { id: 'u7', name: '中村大輔', role: 'エンジニア', avatarColor: '#D97706', initials: '中', status: 'online', position: { x: 380, y: 270 }, avatarStyle: 'notionists', avatarSeed: 'nakamura-daisuke' },
  { id: 'u8', name: '小林由紀', role: 'デザイナー', avatarColor: '#6D28D9', initials: '小', status: 'online', position: { x: 440, y: 250 }, avatarStyle: 'notionists', avatarSeed: 'kobayashi-yuki' },
  { id: 'u9', name: '加藤亮', role: 'エンジニア', avatarColor: '#0891B2', initials: '加', status: 'online', position: { x: 500, y: 280 }, avatarStyle: 'notionists', avatarSeed: 'kato-ryo' },
  { id: 'u10', name: '吉田真理', role: '集中作業中', avatarColor: '#6D28D9', initials: '吉', status: 'focusing', position: { x: 80, y: 295 }, avatarStyle: 'notionists', avatarSeed: 'yoshida-mari' },
  { id: 'u11', name: '松本拓也', role: 'エンジニア', avatarColor: '#0891B2', initials: '松', status: 'online', position: { x: 775, y: 285 }, avatarStyle: 'notionists', avatarSeed: 'matsumoto' },
  { id: 'u12', name: '井上さくら', role: 'HR', avatarColor: '#14B8A6', initials: '井', status: 'online', position: { x: 830, y: 285 }, avatarStyle: 'notionists', avatarSeed: 'inoue-sakura' },
  { id: 'u13', name: '木村彩', role: '休憩中', avatarColor: '#EC4899', initials: '木', status: 'online', position: { x: 120, y: 480 }, avatarStyle: 'notionists', avatarSeed: 'kimura-aya' },
  { id: 'u14', name: '林誠', role: 'エンジニア', avatarColor: '#EA580C', initials: '林', status: 'online', position: { x: 790, y: 490 }, avatarStyle: 'notionists', avatarSeed: 'hayashi-makoto' },
  { id: 'u15', name: '清水美穂', role: 'デザイナー', avatarColor: '#4338CA', initials: '清', status: 'online', position: { x: 840, y: 490 }, avatarStyle: 'notionists', avatarSeed: 'shimizu-miho' },
];

export const activeMeetings = [
  { roomId: 'conference-a', name: '会議室 A', time: '14:00', color: '#3B82F6' },
  { roomId: 'war-room', name: '戦略ルーム', time: '15:30', color: '#22C55E' },
  { roomId: 'brainstorm-1', name: 'ブレスト 1', time: '16:00', color: '#EF4444' },
];

export const liveRooms = new Set(['conference-a', 'war-room', 'brainstorm-1', 'ceo-suite', 'quiet-room']);

// Zones and seats derived from the floor plan furniture positions.
// Seat x,y coordinates correspond to chair positions in the Excalidraw scene.
export const defaultZones: Zone[] = [
  // --- Meeting: 会議室 A (conference-a) ---
  {
    id: 'zone-conference-a',
    type: 'meeting',
    name: '会議室 A',
    x: 30, y: 30, w: 250, h: 190,
    seats: [
      // Top row chairs (ca-c-t0..2)
      { id: 'seat-ca-t0', roomId: 'conference-a', x: 106, y: 76, occupied: false },
      { id: 'seat-ca-t1', roomId: 'conference-a', x: 146, y: 76, occupied: false },
      { id: 'seat-ca-t2', roomId: 'conference-a', x: 186, y: 76, occupied: false },
      // Bottom row chairs (ca-c-b0..2)
      { id: 'seat-ca-b0', roomId: 'conference-a', x: 106, y: 166, occupied: false },
      { id: 'seat-ca-b1', roomId: 'conference-a', x: 146, y: 166, occupied: false },
      { id: 'seat-ca-b2', roomId: 'conference-a', x: 186, y: 166, occupied: false },
    ],
  },
  // --- Meeting: 集中ルーム (quiet-room) ---
  {
    id: 'zone-quiet-room',
    type: 'desk',
    name: '集中ルーム',
    x: 30, y: 240, w: 160, h: 140,
    seats: [
      // qr-c1, qr-c2
      { id: 'seat-qr-0', roomId: 'quiet-room', x: 81, y: 306, occupied: false },
      { id: 'seat-qr-1', roomId: 'quiet-room', x: 151, y: 306, occupied: false },
    ],
  },
  // --- Workspace: オープンスペース (open-plan) ---
  {
    id: 'zone-open-plan',
    type: 'desk',
    name: 'オープンスペース',
    x: 210, y: 100, w: 440, h: 280,
    seats: [
      // Row 0 (y=130 desks): chairs at y=181, x = 266, 366, 466, 566
      { id: 'seat-op-0', roomId: 'open-plan', x: 266, y: 181, occupied: false },
      { id: 'seat-op-1', roomId: 'open-plan', x: 366, y: 181, occupied: false },
      { id: 'seat-op-2', roomId: 'open-plan', x: 466, y: 181, occupied: false },
      { id: 'seat-op-3', roomId: 'open-plan', x: 566, y: 181, occupied: false },
      // Row 1 (y=250 desks): chairs at y=301, x = 266, 366, 466, 566
      { id: 'seat-op-4', roomId: 'open-plan', x: 266, y: 301, occupied: false },
      { id: 'seat-op-5', roomId: 'open-plan', x: 366, y: 301, occupied: false },
      { id: 'seat-op-6', roomId: 'open-plan', x: 466, y: 301, occupied: false },
      { id: 'seat-op-7', roomId: 'open-plan', x: 566, y: 301, occupied: false },
    ],
  },
  // --- Meeting: 役員室 (ceo-suite) ---
  {
    id: 'zone-ceo-suite',
    type: 'meeting',
    name: '役員室',
    x: 700, y: 30, w: 200, h: 160,
    seats: [
      // ceo-c at 777, 122
      { id: 'seat-ceo-0', roomId: 'ceo-suite', x: 777, y: 122, occupied: false },
    ],
  },
  // --- Meeting: 戦略ルーム (war-room) ---
  {
    id: 'zone-war-room',
    type: 'meeting',
    name: '戦略ルーム',
    x: 700, y: 210, w: 200, h: 170,
    seats: [
      // Top row (wr-c-t0..2)
      { id: 'seat-wr-t0', roomId: 'war-room', x: 766, y: 256, occupied: false },
      { id: 'seat-wr-t1', roomId: 'war-room', x: 801, y: 256, occupied: false },
      { id: 'seat-wr-t2', roomId: 'war-room', x: 836, y: 256, occupied: false },
      // Bottom row (wr-c-b0..2)
      { id: 'seat-wr-b0', roomId: 'war-room', x: 766, y: 336, occupied: false },
      { id: 'seat-wr-b1', roomId: 'war-room', x: 801, y: 336, occupied: false },
      { id: 'seat-wr-b2', roomId: 'war-room', x: 836, y: 336, occupied: false },
    ],
  },
  // --- Lounge: ラウンジ ---
  {
    id: 'zone-lounge',
    type: 'lounge',
    name: 'ラウンジ',
    x: 30, y: 420, w: 200, h: 160,
    seats: [
      // Sofa 1 seats (l-s1: x=50, y=450, w=90)
      { id: 'seat-l-s1a', roomId: 'lounge', x: 75, y: 470, occupied: false },
      { id: 'seat-l-s1b', roomId: 'lounge', x: 115, y: 470, occupied: false },
      // Sofa 2 seats (l-s2: x=50, y=530, w=90)
      { id: 'seat-l-s2a', roomId: 'lounge', x: 75, y: 550, occupied: false },
      { id: 'seat-l-s2b', roomId: 'lounge', x: 115, y: 550, occupied: false },
    ],
  },
  // --- Cafe: カフェスペース (open-kitchen) ---
  {
    id: 'zone-cafe',
    type: 'cafe',
    name: 'カフェスペース',
    x: 370, y: 440, w: 280, h: 140,
    seats: [
      // ok-c0..3 chairs around the two tables
      { id: 'seat-ok-0', roomId: 'open-kitchen', x: 401, y: 550, occupied: false },
      { id: 'seat-ok-1', roomId: 'open-kitchen', x: 426, y: 550, occupied: false },
      { id: 'seat-ok-2', roomId: 'open-kitchen', x: 511, y: 550, occupied: false },
      { id: 'seat-ok-3', roomId: 'open-kitchen', x: 536, y: 550, occupied: false },
    ],
  },
  // --- Meeting: ブレスト 1 (brainstorm-1) ---
  {
    id: 'zone-brainstorm',
    type: 'meeting',
    name: 'ブレスト 1',
    x: 700, y: 410, w: 200, h: 170,
    seats: [
      // Top row (bs-ct0..2)
      { id: 'seat-bs-t0', roomId: 'brainstorm-1', x: 771, y: 456, occupied: false },
      { id: 'seat-bs-t1', roomId: 'brainstorm-1', x: 806, y: 456, occupied: false },
      { id: 'seat-bs-t2', roomId: 'brainstorm-1', x: 841, y: 456, occupied: false },
      // Bottom row (bs-cb0..2)
      { id: 'seat-bs-b0', roomId: 'brainstorm-1', x: 771, y: 536, occupied: false },
      { id: 'seat-bs-b1', roomId: 'brainstorm-1', x: 806, y: 536, occupied: false },
      { id: 'seat-bs-b2', roomId: 'brainstorm-1', x: 841, y: 536, occupied: false },
    ],
  },
  // --- Workspace: メディアルーム (media-room) ---
  {
    id: 'zone-media-room',
    type: 'desk',
    name: 'メディアルーム',
    x: 30, y: 600, w: 200, h: 130,
    seats: [
      // mr-c1, mr-c2
      { id: 'seat-mr-0', roomId: 'media-room', x: 86, y: 676, occupied: false },
      { id: 'seat-mr-1', roomId: 'media-room', x: 176, y: 676, occupied: false },
    ],
  },
];
