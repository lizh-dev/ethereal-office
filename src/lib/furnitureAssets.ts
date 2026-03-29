// Furniture assets - Gemini-generated top-down office icons
// Used in isometric template and furniture library

export interface FurnitureAsset {
  id: string;
  name: string;
  src: string;
  width: number;
  height: number;
  isSeat: boolean;
}

export const FURNITURE_ASSETS: FurnitureAsset[] = [
  { id: 'fur-desk', name: 'デスク', src: '/assets/furniture-topdown/desk.png', width: 90, height: 53, isSeat: false },
  { id: 'fur-chair', name: 'オフィスチェア', src: '/assets/furniture-topdown/chair.png', width: 40, height: 25, isSeat: true },
  { id: 'fur-table-round', name: '丸テーブル', src: '/assets/furniture-topdown/table-round.png', width: 70, height: 45, isSeat: false },
  { id: 'fur-table-rect', name: '長テーブル', src: '/assets/furniture-topdown/table-rect.png', width: 90, height: 58, isSeat: false },
  { id: 'fur-sofa', name: 'ソファ', src: '/assets/furniture-topdown/sofa.png', width: 80, height: 51, isSeat: true },
  { id: 'fur-armchair', name: 'アームチェア', src: '/assets/furniture-topdown/armchair.png', width: 45, height: 31, isSeat: true },
  { id: 'fur-plant', name: '観葉植物', src: '/assets/furniture-topdown/plant.png', width: 35, height: 24, isSeat: false },
  { id: 'fur-bookshelf', name: '本棚', src: '/assets/furniture-topdown/bookshelf.png', width: 70, height: 48, isSeat: false },
  { id: 'fur-whiteboard', name: 'ホワイトボード', src: '/assets/furniture-topdown/whiteboard.png', width: 70, height: 48, isSeat: false },
  { id: 'fur-coffee', name: 'コーヒーマシン', src: '/assets/furniture-topdown/coffee-machine.png', width: 30, height: 20, isSeat: false },
  { id: 'fur-monitor', name: 'モニター', src: '/assets/furniture-topdown/monitor.png', width: 40, height: 27, isSeat: false },
  { id: 'fur-partition', name: 'パーティション', src: '/assets/furniture-topdown/partition.png', width: 80, height: 55, isSeat: false },
];

async function fetchAsDataURL(src: string): Promise<string> {
  const res = await fetch(src);
  const blob = await res.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function registerFurnitureFiles(api: any) {
  const files = await Promise.all(
    FURNITURE_ASSETS.map(async (asset) => ({
      id: asset.id,
      dataURL: await fetchAsDataURL(asset.src),
      mimeType: 'image/png',
      created: Date.now(),
    }))
  );
  api.addFiles(files);
  return files;
}

function eid() {
  return `el-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function fur(assetId: string, x: number, y: number, scale = 1) {
  const asset = FURNITURE_ASSETS.find((a) => a.id === assetId)!;
  return {
    id: eid(),
    type: 'image' as const,
    x,
    y,
    width: asset.width * scale,
    height: asset.height * scale,
    fileId: assetId,
    status: 'saved' as const,
    strokeColor: 'transparent',
    backgroundColor: 'transparent',
    fillStyle: 'solid' as const,
    strokeWidth: 0,
    roundness: null,
    opacity: 100,
  };
}

function room(name: string, x: number, y: number, w: number, h: number) {
  return [
    {
      type: 'rectangle', x, y, width: w, height: h,
      backgroundColor: '#ffffff', strokeColor: '#e2e8f0',
      fillStyle: 'solid', roundness: { type: 3 }, strokeWidth: 1,
    },
    {
      type: 'text', x: x + 12, y: y + 8, text: name,
      fontSize: 13, strokeColor: '#64748b',
    },
  ];
}

// Generate demo floor with Gemini top-down assets
export function generateIsometricDemoFloor() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const elements: any[] = [];

  // ===== Workspace (4 desk sets) =====
  elements.push(...room('ワークスペース', 30, 30, 400, 280));

  // Desk row 1
  elements.push(fur('fur-desk', 50, 55));
  elements.push(fur('fur-chair', 75, 115));
  elements.push(fur('fur-desk', 220, 55));
  elements.push(fur('fur-chair', 245, 115));

  // Desk row 2
  elements.push(fur('fur-desk', 50, 170));
  elements.push(fur('fur-chair', 75, 230));
  elements.push(fur('fur-desk', 220, 170));
  elements.push(fur('fur-chair', 245, 230));

  // Decorations
  elements.push(fur('fur-plant', 180, 60));
  elements.push(fur('fur-plant', 390, 40));

  // ===== Meeting Room =====
  elements.push(...room('会議室', 460, 30, 280, 200));

  elements.push(fur('fur-table-round', 555, 85));
  elements.push(fur('fur-chair', 540, 60));
  elements.push(fur('fur-chair', 610, 60));
  elements.push(fur('fur-chair', 540, 140));
  elements.push(fur('fur-chair', 610, 140));
  elements.push(fur('fur-whiteboard', 470, 170));
  elements.push(fur('fur-plant', 700, 40));

  // ===== Lounge =====
  elements.push(...room('ラウンジ', 460, 260, 280, 200));

  elements.push(fur('fur-sofa', 490, 300));
  elements.push(fur('fur-sofa', 490, 390));
  elements.push(fur('fur-armchair', 650, 330));
  elements.push(fur('fur-armchair', 650, 390));
  elements.push(fur('fur-bookshelf', 590, 280));
  elements.push(fur('fur-coffee', 470, 420));
  elements.push(fur('fur-plant', 700, 270));

  return elements;
}
