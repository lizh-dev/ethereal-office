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
  { id: 'fur-desk', name: 'デスク', src: '/assets/furniture-topdown/desk.png', width: 90, height: 51, isSeat: false },
  { id: 'fur-chair', name: 'チェア(下向き)', src: '/assets/furniture-topdown/chair-down.png', width: 32, height: 50, isSeat: true },
  { id: 'fur-chair-up', name: 'チェア(上向き)', src: '/assets/furniture-topdown/chair-up.png', width: 32, height: 50, isSeat: true },
  { id: 'fur-chair-left', name: 'チェア(左向き)', src: '/assets/furniture-topdown/chair-left.png', width: 50, height: 32, isSeat: true },
  { id: 'fur-chair-right', name: 'チェア(右向き)', src: '/assets/furniture-topdown/chair-right.png', width: 50, height: 32, isSeat: true },
  { id: 'fur-table-round', name: '丸テーブル', src: '/assets/furniture-topdown/table-round.png', width: 65, height: 65, isSeat: false },
  { id: 'fur-table-rect', name: '長テーブル', src: '/assets/furniture-topdown/table-rect.png', width: 90, height: 62, isSeat: false },
  { id: 'fur-sofa', name: 'ソファ', src: '/assets/furniture-topdown/sofa.png', width: 55, height: 54, isSeat: true },
  { id: 'fur-armchair', name: 'アームチェア', src: '/assets/furniture-topdown/armchair.png', width: 40, height: 40, isSeat: true },
  { id: 'fur-plant', name: '観葉植物', src: '/assets/furniture-topdown/plant.png', width: 35, height: 33, isSeat: false },
  { id: 'fur-bookshelf', name: '本棚', src: '/assets/furniture-topdown/bookshelf.png', width: 70, height: 55, isSeat: false },
  { id: 'fur-whiteboard', name: 'ホワイトボード', src: '/assets/furniture-topdown/whiteboard.png', width: 80, height: 49, isSeat: false },
  { id: 'fur-coffee', name: 'コーヒーマシン', src: '/assets/furniture-topdown/coffee-machine.png', width: 25, height: 24, isSeat: false },
  { id: 'fur-monitor', name: 'モニター', src: '/assets/furniture-topdown/monitor.png', width: 30, height: 29, isSeat: false },
  { id: 'fur-partition', name: 'パーティション', src: '/assets/furniture-topdown/partition.png', width: 90, height: 16, isSeat: false },
  { id: 'fur-rug', name: 'ラグ', src: '/assets/furniture-topdown/rug.png', width: 85, height: 64, isSeat: false },
  { id: 'fur-laptop', name: 'ラップトップ', src: '/assets/furniture-topdown/laptop.png', width: 35, height: 29, isSeat: false },
  { id: 'fur-printer', name: 'プリンター', src: '/assets/furniture-topdown/printer.png', width: 35, height: 30, isSeat: false },
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

  // ===== Workspace (4 desk+chair sets in 2 rows) =====
  elements.push(...room('ワークスペース', 30, 30, 380, 310));

  // Row 1: 2 desks with chairs facing up toward desk
  elements.push(fur('fur-desk', 55, 60));
  elements.push(fur('fur-monitor', 85, 65));
  elements.push(fur('fur-chair-up', 84, 120));

  elements.push(fur('fur-desk', 215, 60));
  elements.push(fur('fur-monitor', 245, 65));
  elements.push(fur('fur-chair-up', 244, 120));

  // Row 2
  elements.push(fur('fur-desk', 55, 190));
  elements.push(fur('fur-monitor', 85, 195));
  elements.push(fur('fur-chair-up', 84, 250));

  elements.push(fur('fur-desk', 215, 190));
  elements.push(fur('fur-monitor', 245, 195));
  elements.push(fur('fur-chair-up', 244, 250));

  // Decorations
  elements.push(fur('fur-plant', 175, 55));
  elements.push(fur('fur-plant', 370, 40));

  // ===== Meeting Room =====
  elements.push(...room('会議室', 440, 30, 310, 220));

  // Table centered in room
  const tblW = 65, tblH = 65;
  const tblX = 440 + (310 - tblW) / 2;  // room center
  const tblY = 30 + (220 - tblH) / 2;
  elements.push(fur('fur-table-round', tblX, tblY));
  // Chairs equidistant from table center
  const cx = tblX + tblW / 2, cy = tblY + tblH / 2;
  const dist = 50;  // distance from center to chair center
  const chW = 32, chH = 50, chWh = 50, chHh = 32;  // vertical / horizontal chair sizes
  elements.push(fur('fur-chair', cx - chW / 2, cy - dist - chH / 2));        // top
  elements.push(fur('fur-chair-up', cx - chW / 2, cy + dist - chH / 2));     // bottom
  elements.push(fur('fur-chair-right', cx - dist - chWh / 2, cy - chHh / 2)); // left
  elements.push(fur('fur-chair-left', cx + dist - chWh / 2, cy - chHh / 2));  // right
  elements.push(fur('fur-whiteboard', 460, 190));
  elements.push(fur('fur-plant', 710, 40));

  // ===== Lounge =====
  elements.push(...room('ラウンジ', 440, 280, 310, 220));

  elements.push(fur('fur-sofa', 480, 320));
  elements.push(fur('fur-sofa', 480, 420));
  elements.push(fur('fur-armchair', 620, 350));
  elements.push(fur('fur-armchair', 620, 410));
  elements.push(fur('fur-bookshelf', 555, 300));
  elements.push(fur('fur-coffee', 460, 460));
  elements.push(fur('fur-plant', 710, 290));

  return elements;
}
