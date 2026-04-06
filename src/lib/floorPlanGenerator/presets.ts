import type { FloorPlanConfig } from './types';

export interface FloorPlanPreset {
  id: string;
  name: string;
  description: string;
  category: 'startup' | 'corporate' | 'education' | 'creative' | 'coworking' | 'minimal';
  teamSize: 'small' | 'medium' | 'large';
  config: FloorPlanConfig;
}

export const FLOOR_PLAN_PRESETS: FloorPlanPreset[] = [
  // ── Small ──
  {
    id: 'fp-solo-studio',
    name: 'ソロスタジオ',
    description: '1-2人用の小さなワークスペース',
    category: 'minimal',
    teamSize: 'small',
    config: {
      width: 800, height: 500,
      style: 'modern',
      backgroundColor: '#f5f0e8',
      exteriorWallThickness: 8,
      interiorWallThickness: 6,
      rooms: [
        { id: 'r1', type: 'workspace', name: 'ワークスペース', x: 8, y: 8, width: 784, height: 484, doors: [], windows: [{ wall: 0, position: 0.3 }, { wall: 0, position: 0.7 }], showLabel: true },
      ],
      decorations: [
        { type: 'plant', x: 30, y: 30 },
        { type: 'plant', x: 770, y: 470 },
      ],
    },
  },
  {
    id: 'fp-small-startup',
    name: 'スタートアップ (S)',
    description: '3-6人用。ワークスペース + 会議室 + ラウンジ',
    category: 'startup',
    teamSize: 'small',
    config: {
      width: 1200, height: 640,
      style: 'modern',
      backgroundColor: '#f5f0e8',
      exteriorWallThickness: 8,
      interiorWallThickness: 6,
      rooms: [
        { id: 'r1', type: 'workspace', name: 'ワークスペース', x: 8, y: 8, width: 720, height: 624, doors: [], windows: [{ wall: 0, position: 0.2 }, { wall: 0, position: 0.5 }, { wall: 0, position: 0.8 }] },
        { id: 'r2', type: 'meeting', name: '会議室', x: 728, y: 8, width: 464, height: 370, doors: [{ wall: 3, position: 0.7, width: 60 }], windows: [{ wall: 0, position: 0.4 }, { wall: 0, position: 0.8 }] },
        { id: 'r3', type: 'cafe', name: 'ラウンジ', x: 728, y: 378, width: 464, height: 254, doors: [{ wall: 3, position: 0.4, width: 60 }], windows: [] },
      ],
      decorations: [
        { type: 'plant', x: 30, y: 30 },
        { type: 'plant', x: 1170, y: 30 },
        { type: 'plant', x: 30, y: 610 },
        { type: 'plant', x: 1170, y: 610 },
        { type: 'rug', x: 960, y: 505 },
      ],
    },
  },
  {
    id: 'fp-pair-office',
    name: 'ペアオフィス',
    description: '2-4人用。デスクエリア + 小会議コーナー',
    category: 'minimal',
    teamSize: 'small',
    config: {
      width: 1000, height: 500,
      style: 'modern',
      backgroundColor: '#f5f0e8',
      exteriorWallThickness: 8,
      interiorWallThickness: 6,
      rooms: [
        { id: 'r1', type: 'workspace', name: 'デスクエリア', x: 8, y: 8, width: 640, height: 484, doors: [], windows: [{ wall: 0, position: 0.3 }, { wall: 0, position: 0.7 }] },
        { id: 'r2', type: 'meeting', name: 'ミーティング', x: 648, y: 8, width: 344, height: 484, doors: [{ wall: 3, position: 0.5, width: 50 }], windows: [{ wall: 0, position: 0.5 }] },
      ],
      decorations: [
        { type: 'plant', x: 25, y: 25 },
        { type: 'plant', x: 975, y: 475 },
      ],
    },
  },

  // ── Medium ──
  {
    id: 'fp-medium-office',
    name: 'スタンダードオフィス (M)',
    description: '8-15人用。ワーク×2 + 会議 + 休憩 + 受付',
    category: 'corporate',
    teamSize: 'medium',
    config: {
      width: 1600, height: 800,
      style: 'modern',
      backgroundColor: '#f5f0e8',
      exteriorWallThickness: 8,
      interiorWallThickness: 6,
      rooms: [
        { id: 'r1', type: 'workspace', name: 'エンジニアリング', x: 8, y: 8, width: 550, height: 500, doors: [{ wall: 1, position: 0.5 }], windows: [{ wall: 0, position: 0.3 }, { wall: 0, position: 0.7 }] },
        { id: 'r2', type: 'workspace', name: 'ビジネス', x: 8, y: 508, width: 550, height: 284, doors: [{ wall: 1, position: 0.4 }], windows: [{ wall: 3, position: 0.5 }] },
        { id: 'r3', type: 'reception', name: 'エントランス', x: 558, y: 8, width: 500, height: 300, doors: [{ wall: 2, position: 0.5, width: 80 }], windows: [{ wall: 0, position: 0.3 }, { wall: 0, position: 0.7 }] },
        { id: 'r4', type: 'meeting', name: '会議室A', x: 1058, y: 8, width: 534, height: 380, doors: [{ wall: 3, position: 0.6 }], windows: [{ wall: 0, position: 0.3 }, { wall: 0, position: 0.7 }] },
        { id: 'r5', type: 'break-room', name: '休憩室', x: 558, y: 308, width: 500, height: 484, doors: [{ wall: 0, position: 0.5 }], windows: [] },
        { id: 'r6', type: 'cafe', name: 'カフェ', x: 1058, y: 388, width: 534, height: 404, doors: [{ wall: 3, position: 0.3 }], windows: [{ wall: 1, position: 0.5 }] },
      ],
      decorations: [
        { type: 'plant', x: 25, y: 25 },
        { type: 'plant', x: 1575, y: 25 },
        { type: 'plant', x: 25, y: 775 },
        { type: 'plant', x: 1575, y: 775 },
        { type: 'rug', x: 808, y: 150 },
        { type: 'plant', x: 560, y: 310 },
      ],
    },
  },
  {
    id: 'fp-startup-m',
    name: 'スタートアップ (M)',
    description: '6-12人用。オープンフロア + 会議 + カフェ',
    category: 'startup',
    teamSize: 'medium',
    config: {
      width: 1400, height: 700,
      style: 'modern',
      backgroundColor: '#f5f0e8',
      exteriorWallThickness: 8,
      interiorWallThickness: 6,
      rooms: [
        { id: 'r1', type: 'open-area', name: 'ワークフロア', x: 8, y: 8, width: 900, height: 684, doors: [], windows: [{ wall: 0, position: 0.2 }, { wall: 0, position: 0.5 }, { wall: 0, position: 0.8 }] },
        { id: 'r2', type: 'meeting', name: '会議室', x: 908, y: 8, width: 484, height: 350, doors: [{ wall: 3, position: 0.6, width: 60 }], windows: [{ wall: 0, position: 0.5 }] },
        { id: 'r3', type: 'cafe', name: 'カフェスペース', x: 908, y: 358, width: 484, height: 334, doors: [{ wall: 3, position: 0.3, width: 60 }], windows: [{ wall: 1, position: 0.5 }] },
      ],
      decorations: [
        { type: 'plant', x: 25, y: 25 },
        { type: 'plant', x: 1375, y: 25 },
        { type: 'plant', x: 25, y: 675 },
        { type: 'plant', x: 1375, y: 675 },
        { type: 'rug', x: 1150, y: 525 },
      ],
    },
  },
  {
    id: 'fp-classroom',
    name: '教室',
    description: '教室 + 講師室。教育向け',
    category: 'education',
    teamSize: 'medium',
    config: {
      width: 1200, height: 700,
      style: 'traditional',
      backgroundColor: '#f5f0e8',
      exteriorWallThickness: 8,
      interiorWallThickness: 6,
      rooms: [
        { id: 'r1', type: 'workspace', name: '教室', x: 8, y: 8, width: 850, height: 684, doors: [{ wall: 1, position: 0.8, width: 60 }], windows: [{ wall: 0, position: 0.2 }, { wall: 0, position: 0.5 }, { wall: 0, position: 0.8 }] },
        { id: 'r2', type: 'executive', name: '講師室', x: 858, y: 8, width: 334, height: 340, doors: [{ wall: 3, position: 0.7, width: 50 }], windows: [{ wall: 0, position: 0.5 }] },
        { id: 'r3', type: 'break-room', name: '休憩コーナー', x: 858, y: 348, width: 334, height: 344, doors: [{ wall: 3, position: 0.3, width: 50 }], windows: [] },
      ],
      decorations: [
        { type: 'plant', x: 25, y: 25 },
        { type: 'plant', x: 1175, y: 25 },
        { type: 'plant', x: 25, y: 675 },
        { type: 'plant', x: 1175, y: 675 },
      ],
    },
  },
  {
    id: 'fp-coworking',
    name: 'コワーキング',
    description: 'ホットデスク + フォーカスブース + カフェ',
    category: 'coworking',
    teamSize: 'medium',
    config: {
      width: 1400, height: 700,
      style: 'modern',
      backgroundColor: '#f5f0e8',
      exteriorWallThickness: 8,
      interiorWallThickness: 6,
      rooms: [
        { id: 'r1', type: 'open-area', name: 'ホットデスク', x: 8, y: 8, width: 650, height: 684, doors: [], windows: [{ wall: 0, position: 0.3 }, { wall: 0, position: 0.7 }] },
        { id: 'r2', type: 'workspace', name: 'フォーカスブース', x: 658, y: 8, width: 400, height: 340, doors: [{ wall: 3, position: 0.6 }], windows: [{ wall: 0, position: 0.5 }] },
        { id: 'r3', type: 'meeting', name: 'ミーティング', x: 658, y: 348, width: 400, height: 344, doors: [{ wall: 3, position: 0.4 }], windows: [] },
        { id: 'r4', type: 'cafe', name: 'カフェラウンジ', x: 1058, y: 8, width: 334, height: 684, doors: [{ wall: 3, position: 0.3 }], windows: [{ wall: 1, position: 0.3 }, { wall: 1, position: 0.7 }] },
      ],
      decorations: [
        { type: 'plant', x: 25, y: 25 },
        { type: 'plant', x: 1375, y: 25 },
        { type: 'plant', x: 25, y: 675 },
        { type: 'plant', x: 1375, y: 675 },
        { type: 'plant', x: 660, y: 350 },
        { type: 'rug', x: 1225, y: 500 },
      ],
    },
  },

  // ── Large ──
  {
    id: 'fp-large-corporate',
    name: 'コーポレート (L)',
    description: '15-30人用。部署×3 + 会議×2 + 役員室 + カフェ + 受付',
    category: 'corporate',
    teamSize: 'large',
    config: {
      width: 2000, height: 1000,
      style: 'modern',
      backgroundColor: '#f5f0e8',
      exteriorWallThickness: 8,
      interiorWallThickness: 6,
      rooms: [
        { id: 'r1', type: 'reception', name: 'エントランス', x: 8, y: 8, width: 600, height: 300, doors: [{ wall: 2, position: 0.5, width: 80 }], windows: [{ wall: 0, position: 0.3 }, { wall: 0, position: 0.7 }] },
        { id: 'r2', type: 'workspace', name: '開発チーム', x: 8, y: 308, width: 600, height: 684, doors: [{ wall: 0, position: 0.5 }], windows: [{ wall: 3, position: 0.3 }, { wall: 3, position: 0.7 }] },
        { id: 'r3', type: 'workspace', name: '営業チーム', x: 608, y: 8, width: 550, height: 500, doors: [{ wall: 2, position: 0.3 }], windows: [{ wall: 0, position: 0.3 }, { wall: 0, position: 0.7 }] },
        { id: 'r4', type: 'meeting', name: '会議室A', x: 608, y: 508, width: 550, height: 484, doors: [{ wall: 0, position: 0.5 }], windows: [] },
        { id: 'r5', type: 'executive', name: '役員室', x: 1158, y: 8, width: 400, height: 350, doors: [{ wall: 2, position: 0.5 }], windows: [{ wall: 0, position: 0.5 }] },
        { id: 'r6', type: 'meeting', name: '会議室B', x: 1158, y: 358, width: 400, height: 300, doors: [{ wall: 3, position: 0.5 }], windows: [] },
        { id: 'r7', type: 'workspace', name: 'マーケティング', x: 1558, y: 8, width: 434, height: 500, doors: [{ wall: 3, position: 0.7 }], windows: [{ wall: 0, position: 0.3 }, { wall: 0, position: 0.7 }, { wall: 1, position: 0.3 }, { wall: 1, position: 0.7 }] },
        { id: 'r8', type: 'cafe', name: 'カフェ', x: 1158, y: 658, width: 834, height: 334, doors: [{ wall: 0, position: 0.3 }], windows: [{ wall: 1, position: 0.5 }] },
      ],
      decorations: [
        { type: 'plant', x: 25, y: 25 }, { type: 'plant', x: 1975, y: 25 },
        { type: 'plant', x: 25, y: 975 }, { type: 'plant', x: 1975, y: 975 },
        { type: 'rug', x: 308, y: 150 },
        { type: 'plant', x: 610, y: 510 },
        { type: 'plant', x: 1160, y: 10 },
        { type: 'rug', x: 1575, y: 825 },
      ],
    },
  },
  {
    id: 'fp-creative-studio',
    name: 'クリエイティブスタジオ',
    description: 'オープンアトリエ + ギャラリー + 打合せ',
    category: 'creative',
    teamSize: 'medium',
    config: {
      width: 1400, height: 700,
      style: 'industrial',
      backgroundColor: '#f0ede8',
      exteriorWallThickness: 8,
      interiorWallThickness: 6,
      rooms: [
        { id: 'r1', type: 'open-area', name: 'アトリエ', x: 8, y: 8, width: 700, height: 684, doors: [], windows: [{ wall: 0, position: 0.2 }, { wall: 0, position: 0.5 }, { wall: 0, position: 0.8 }, { wall: 3, position: 0.3 }, { wall: 3, position: 0.7 }] },
        { id: 'r2', type: 'workspace', name: 'デスクエリア', x: 708, y: 8, width: 684, height: 350, doors: [{ wall: 3, position: 0.5 }], windows: [{ wall: 0, position: 0.3 }, { wall: 0, position: 0.7 }] },
        { id: 'r3', type: 'cafe', name: 'ラウンジ', x: 708, y: 358, width: 340, height: 334, doors: [{ wall: 3, position: 0.4, width: 60 }], windows: [] },
        { id: 'r4', type: 'meeting', name: '打合せ', x: 1048, y: 358, width: 344, height: 334, doors: [{ wall: 3, position: 0.4, width: 60 }], windows: [{ wall: 1, position: 0.5 }] },
      ],
      decorations: [
        { type: 'plant', x: 25, y: 25 }, { type: 'plant', x: 1375, y: 25 },
        { type: 'plant', x: 25, y: 675 }, { type: 'plant', x: 1375, y: 675 },
        { type: 'rug', x: 350, y: 350 },
      ],
    },
  },
  {
    id: 'fp-open-plan',
    name: 'オープンプラン',
    description: '壁なし、完全オープンフロア',
    category: 'minimal',
    teamSize: 'medium',
    config: {
      width: 1200, height: 640,
      style: 'modern',
      backgroundColor: '#f5f0e8',
      exteriorWallThickness: 8,
      interiorWallThickness: 6,
      rooms: [
        { id: 'r1', type: 'open-area', name: 'オープンフロア', x: 8, y: 8, width: 1184, height: 624, doors: [{ wall: 2, position: 0.5, width: 80 }], windows: [{ wall: 0, position: 0.15 }, { wall: 0, position: 0.4 }, { wall: 0, position: 0.6 }, { wall: 0, position: 0.85 }] },
      ],
      decorations: [
        { type: 'plant', x: 30, y: 30 }, { type: 'plant', x: 1170, y: 30 },
        { type: 'plant', x: 30, y: 610 }, { type: 'plant', x: 1170, y: 610 },
      ],
    },
  },
  {
    id: 'fp-support-center',
    name: 'サポートセンター',
    description: 'オペレーターデスク + スーパーバイザー + 休憩室',
    category: 'corporate',
    teamSize: 'large',
    config: {
      width: 1600, height: 800,
      style: 'modern',
      backgroundColor: '#f5f0e8',
      exteriorWallThickness: 8,
      interiorWallThickness: 6,
      rooms: [
        { id: 'r1', type: 'workspace', name: 'オペレーターフロア', x: 8, y: 8, width: 1000, height: 784, doors: [{ wall: 1, position: 0.3 }], windows: [{ wall: 0, position: 0.2 }, { wall: 0, position: 0.5 }, { wall: 0, position: 0.8 }, { wall: 3, position: 0.3 }, { wall: 3, position: 0.7 }] },
        { id: 'r2', type: 'executive', name: 'SV室', x: 1008, y: 8, width: 584, height: 300, doors: [{ wall: 3, position: 0.6, width: 50 }], windows: [{ wall: 0, position: 0.4 }] },
        { id: 'r3', type: 'meeting', name: 'ミーティング', x: 1008, y: 308, width: 584, height: 250, doors: [{ wall: 3, position: 0.4 }], windows: [] },
        { id: 'r4', type: 'break-room', name: '休憩室', x: 1008, y: 558, width: 584, height: 234, doors: [{ wall: 3, position: 0.4 }], windows: [{ wall: 1, position: 0.5 }] },
      ],
      decorations: [
        { type: 'plant', x: 25, y: 25 }, { type: 'plant', x: 1575, y: 25 },
        { type: 'plant', x: 25, y: 775 }, { type: 'plant', x: 1575, y: 775 },
      ],
    },
  },
  {
    id: 'fp-hybrid-office',
    name: 'ハイブリッドオフィス',
    description: 'フォーカスブース + コラボエリア + カフェ',
    category: 'coworking',
    teamSize: 'large',
    config: {
      width: 1800, height: 900,
      style: 'modern',
      backgroundColor: '#f5f0e8',
      exteriorWallThickness: 8,
      interiorWallThickness: 6,
      rooms: [
        { id: 'r1', type: 'open-area', name: 'コラボレーション', x: 8, y: 8, width: 800, height: 884, doors: [], windows: [{ wall: 0, position: 0.2 }, { wall: 0, position: 0.5 }, { wall: 0, position: 0.8 }, { wall: 3, position: 0.3 }, { wall: 3, position: 0.7 }] },
        { id: 'r2', type: 'workspace', name: 'フォーカスA', x: 808, y: 8, width: 450, height: 440, doors: [{ wall: 3, position: 0.6 }], windows: [{ wall: 0, position: 0.5 }] },
        { id: 'r3', type: 'workspace', name: 'フォーカスB', x: 808, y: 448, width: 450, height: 444, doors: [{ wall: 3, position: 0.4 }], windows: [] },
        { id: 'r4', type: 'meeting', name: '会議室', x: 1258, y: 8, width: 534, height: 350, doors: [{ wall: 3, position: 0.6 }], windows: [{ wall: 0, position: 0.4 }, { wall: 1, position: 0.4 }] },
        { id: 'r5', type: 'cafe', name: 'カフェ', x: 1258, y: 358, width: 534, height: 534, doors: [{ wall: 3, position: 0.3 }], windows: [{ wall: 1, position: 0.5 }] },
      ],
      decorations: [
        { type: 'plant', x: 25, y: 25 }, { type: 'plant', x: 1775, y: 25 },
        { type: 'plant', x: 25, y: 875 }, { type: 'plant', x: 1775, y: 875 },
        { type: 'rug', x: 400, y: 450 },
        { type: 'rug', x: 1525, y: 625 },
      ],
    },
  },
];

export const PRESET_CATEGORIES: Record<string, string> = {
  startup: 'スタートアップ',
  corporate: '企業',
  education: '教育',
  creative: 'クリエイティブ',
  coworking: 'コワーキング',
  minimal: 'シンプル',
};
