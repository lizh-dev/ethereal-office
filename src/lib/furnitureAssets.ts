// Furniture asset definitions for isometric Kenney furniture
// CC0 License - https://kenney.nl/assets/furniture-kit

export interface FurnitureAsset {
  id: string;
  name: string;
  src: string;
  width: number;
  height: number;
  isSeat: boolean;
}

export const FURNITURE_ASSETS: FurnitureAsset[] = [
  { id: 'fur-desk', name: 'デスク', src: '/assets/furniture/desk.png', width: 80, height: 84, isSeat: false },
  { id: 'fur-desk-corner', name: 'コーナーデスク', src: '/assets/furniture/desk-corner.png', width: 90, height: 90, isSeat: false },
  { id: 'fur-chair', name: 'オフィスチェア', src: '/assets/furniture/chair.png', width: 40, height: 45, isSeat: true },
  { id: 'fur-monitor', name: 'モニター', src: '/assets/furniture/monitor.png', width: 35, height: 35, isSeat: false },
  { id: 'fur-sofa', name: 'ソファ', src: '/assets/furniture/sofa.png', width: 85, height: 65, isSeat: true },
  { id: 'fur-lounge-chair', name: 'ラウンジチェア', src: '/assets/furniture/lounge-chair.png', width: 55, height: 60, isSeat: true },
  { id: 'fur-table-round', name: '丸テーブル', src: '/assets/furniture/table-round.png', width: 65, height: 45, isSeat: false },
  { id: 'fur-table-coffee', name: 'コーヒーテーブル', src: '/assets/furniture/table-coffee.png', width: 60, height: 45, isSeat: false },
  { id: 'fur-plant', name: '観葉植物', src: '/assets/furniture/plant.png', width: 30, height: 45, isSeat: false },
  { id: 'fur-bookcase', name: '本棚', src: '/assets/furniture/bookcase.png', width: 65, height: 75, isSeat: false },
  { id: 'fur-lamp', name: 'フロアランプ', src: '/assets/furniture/lamp.png', width: 25, height: 50, isSeat: false },
  { id: 'fur-rug', name: 'ラグ', src: '/assets/furniture/rug.png', width: 90, height: 55, isSeat: false },
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

// Load all furniture images and register them with Excalidraw API
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

function furnitureElement(assetId: string, x: number, y: number, w?: number, h?: number) {
  const asset = FURNITURE_ASSETS.find((a) => a.id === assetId)!;
  return {
    id: eid(),
    type: 'image' as const,
    x,
    y,
    width: w ?? asset.width,
    height: h ?? asset.height,
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

// Generate isometric demo floor — wider layout, proper spacing
export function generateIsometricDemoFloor() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const elements: any[] = [];

  // ===== Workspace area (left side) =====
  elements.push({
    type: 'rectangle', x: 40, y: 40, width: 450, height: 350,
    backgroundColor: '#ffffff', strokeColor: '#e2e8f0',
    fillStyle: 'solid', roundness: { type: 3 }, strokeWidth: 1,
  });
  elements.push({
    type: 'text', x: 55, y: 52, text: 'ワークスペース',
    fontSize: 14, strokeColor: '#64748b',
  });

  // Desk row 1 (2 desks with chairs, spaced out)
  elements.push(furnitureElement('fur-desk', 70, 90));
  elements.push(furnitureElement('fur-monitor', 93, 95));
  elements.push(furnitureElement('fur-chair', 90, 180));

  elements.push(furnitureElement('fur-desk', 260, 90));
  elements.push(furnitureElement('fur-monitor', 283, 95));
  elements.push(furnitureElement('fur-chair', 280, 180));

  // Desk row 2
  elements.push(furnitureElement('fur-desk', 70, 240));
  elements.push(furnitureElement('fur-monitor', 93, 245));
  elements.push(furnitureElement('fur-chair', 90, 330));

  elements.push(furnitureElement('fur-desk', 260, 240));
  elements.push(furnitureElement('fur-monitor', 283, 245));
  elements.push(furnitureElement('fur-chair', 280, 330));

  // Decorations
  elements.push(furnitureElement('fur-plant', 200, 100));
  elements.push(furnitureElement('fur-plant', 420, 50));

  // ===== Meeting Room (top right) =====
  elements.push({
    type: 'rectangle', x: 530, y: 40, width: 320, height: 220,
    backgroundColor: '#ffffff', strokeColor: '#e2e8f0',
    fillStyle: 'solid', roundness: { type: 3 }, strokeWidth: 1,
  });
  elements.push({
    type: 'text', x: 545, y: 52, text: '会議室',
    fontSize: 14, strokeColor: '#64748b',
  });

  elements.push(furnitureElement('fur-table-round', 650, 110));
  elements.push(furnitureElement('fur-chair', 630, 80));
  elements.push(furnitureElement('fur-chair', 720, 80));
  elements.push(furnitureElement('fur-chair', 630, 165));
  elements.push(furnitureElement('fur-chair', 720, 165));
  elements.push(furnitureElement('fur-plant', 545, 210));
  elements.push(furnitureElement('fur-plant', 810, 50));

  // ===== Lounge (bottom right) =====
  elements.push({
    type: 'rectangle', x: 530, y: 300, width: 320, height: 260,
    backgroundColor: '#ffffff', strokeColor: '#e2e8f0',
    fillStyle: 'solid', roundness: { type: 3 }, strokeWidth: 1,
  });
  elements.push({
    type: 'text', x: 545, y: 312, text: 'ラウンジ',
    fontSize: 14, strokeColor: '#64748b',
  });

  elements.push(furnitureElement('fur-rug', 600, 410));
  elements.push(furnitureElement('fur-sofa', 610, 355));
  elements.push(furnitureElement('fur-table-coffee', 625, 430));
  elements.push(furnitureElement('fur-sofa', 610, 475));
  elements.push(furnitureElement('fur-lounge-chair', 740, 390));
  elements.push(furnitureElement('fur-lamp', 810, 320));
  elements.push(furnitureElement('fur-bookcase', 545, 460));
  elements.push(furnitureElement('fur-plant', 810, 510));

  return elements;
}
