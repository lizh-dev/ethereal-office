// Furniture asset definitions for isometric Kenney furniture
// CC0 License - https://kenney.nl/assets/furniture-kit

export interface FurnitureAsset {
  id: string;
  name: string;
  src: string;       // path in /public
  width: number;     // display width in Excalidraw
  height: number;    // display height in Excalidraw
  isSeat: boolean;   // if true, treated as a chair/seat for sitting
}

export const FURNITURE_ASSETS: FurnitureAsset[] = [
  { id: 'fur-desk', name: 'デスク', src: '/assets/furniture/desk.png', width: 80, height: 84, isSeat: false },
  { id: 'fur-desk-corner', name: 'コーナーデスク', src: '/assets/furniture/desk-corner.png', width: 90, height: 90, isSeat: false },
  { id: 'fur-chair', name: 'オフィスチェア', src: '/assets/furniture/chair.png', width: 45, height: 50, isSeat: true },
  { id: 'fur-monitor', name: 'モニター', src: '/assets/furniture/monitor.png', width: 40, height: 40, isSeat: false },
  { id: 'fur-sofa', name: 'ソファ', src: '/assets/furniture/sofa.png', width: 90, height: 70, isSeat: true },
  { id: 'fur-lounge-chair', name: 'ラウンジチェア', src: '/assets/furniture/lounge-chair.png', width: 60, height: 65, isSeat: true },
  { id: 'fur-table-round', name: '丸テーブル', src: '/assets/furniture/table-round.png', width: 70, height: 50, isSeat: false },
  { id: 'fur-table-coffee', name: 'コーヒーテーブル', src: '/assets/furniture/table-coffee.png', width: 65, height: 50, isSeat: false },
  { id: 'fur-plant', name: '観葉植物', src: '/assets/furniture/plant.png', width: 35, height: 50, isSeat: false },
  { id: 'fur-bookcase', name: '本棚', src: '/assets/furniture/bookcase.png', width: 70, height: 80, isSeat: false },
  { id: 'fur-lamp', name: 'フロアランプ', src: '/assets/furniture/lamp.png', width: 30, height: 55, isSeat: false },
  { id: 'fur-rug', name: 'ラグ', src: '/assets/furniture/rug.png', width: 100, height: 60, isSeat: false },
];

// Convert image file to data URL for Excalidraw
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
    FURNITURE_ASSETS.map(async (asset) => {
      const dataURL = await fetchAsDataURL(asset.src);
      return {
        id: asset.id,
        dataURL,
        mimeType: 'image/png',
        created: Date.now(),
      };
    })
  );
  api.addFiles(files);
  return files;
}

// Generate a unique element ID
function eid() {
  return `el-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Create an Excalidraw image element for a furniture item
function furnitureElement(
  assetId: string,
  x: number,
  y: number,
  width?: number,
  height?: number,
  groupIds?: string[],
) {
  const asset = FURNITURE_ASSETS.find((a) => a.id === assetId);
  if (!asset) throw new Error(`Unknown asset: ${assetId}`);
  return {
    id: eid(),
    type: 'image' as const,
    x,
    y,
    width: width ?? asset.width,
    height: height ?? asset.height,
    fileId: assetId,
    status: 'saved' as const,
    groupIds: groupIds ?? [],
    strokeColor: 'transparent',
    backgroundColor: 'transparent',
    fillStyle: 'solid' as const,
    strokeWidth: 0,
    roundness: null,
    opacity: 100,
  };
}

// Generate a demo isometric office floor
export function generateIsometricDemoFloor() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const elements: any[] = [];

  // Floor background
  elements.push({
    type: 'rectangle', x: 20, y: 20, width: 800, height: 550,
    backgroundColor: '#f8fafc', strokeColor: '#e2e8f0',
    fillStyle: 'solid', roundness: { type: 3 }, strokeWidth: 1,
  });
  elements.push({
    type: 'text', x: 35, y: 30, text: 'SmartOffice デモフロア',
    fontSize: 16, strokeColor: '#475569',
  });

  // === Desk Area (4 desks with chairs) ===
  elements.push({
    type: 'rectangle', x: 40, y: 60, width: 380, height: 230,
    backgroundColor: '#ffffff', strokeColor: '#e5e7eb',
    fillStyle: 'solid', roundness: { type: 3 }, strokeWidth: 1,
  });
  elements.push({
    type: 'text', x: 55, y: 70, text: 'ワークスペース',
    fontSize: 12, strokeColor: '#6b7280',
  });

  // Row 1: 2 desk sets
  for (let i = 0; i < 2; i++) {
    const bx = 60 + i * 180;
    elements.push(furnitureElement('fur-desk', bx, 95));
    elements.push(furnitureElement('fur-monitor', bx + 20, 90));
    elements.push(furnitureElement('fur-chair', bx + 18, 180));
  }

  // Row 2: 2 desk sets
  for (let i = 0; i < 2; i++) {
    const bx = 60 + i * 180;
    elements.push(furnitureElement('fur-desk-corner', bx, 200));
    elements.push(furnitureElement('fur-monitor', bx + 25, 195));
    elements.push(furnitureElement('fur-chair', bx + 22, 275));  // Removed extra closing paren
  }

  // Plants between desks
  elements.push(furnitureElement('fur-plant', 165, 100));
  elements.push(furnitureElement('fur-plant', 345, 210));

  // === Meeting Room ===
  elements.push({
    type: 'rectangle', x: 450, y: 60, width: 350, height: 200,
    backgroundColor: '#ffffff', strokeColor: '#e5e7eb',
    fillStyle: 'solid', roundness: { type: 3 }, strokeWidth: 1,
  });
  elements.push({
    type: 'text', x: 465, y: 70, text: '会議室 A',
    fontSize: 12, strokeColor: '#6b7280',
  });

  // Meeting table + chairs around it
  elements.push(furnitureElement('fur-table-round', 580, 120));
  elements.push(furnitureElement('fur-chair', 560, 90));
  elements.push(furnitureElement('fur-chair', 640, 90));
  elements.push(furnitureElement('fur-chair', 560, 175));
  elements.push(furnitureElement('fur-chair', 640, 175));
  elements.push(furnitureElement('fur-plant', 470, 95));
  elements.push(furnitureElement('fur-plant', 760, 95));

  // === Lounge Area ===
  elements.push({
    type: 'rectangle', x: 450, y: 290, width: 350, height: 260,
    backgroundColor: '#ffffff', strokeColor: '#e5e7eb',
    fillStyle: 'solid', roundness: { type: 3 }, strokeWidth: 1,
  });
  elements.push({
    type: 'text', x: 465, y: 300, text: 'ラウンジ',
    fontSize: 12, strokeColor: '#6b7280',
  });

  // Sofas + coffee table
  elements.push(furnitureElement('fur-rug', 520, 380));
  elements.push(furnitureElement('fur-sofa', 530, 330));
  elements.push(furnitureElement('fur-table-coffee', 545, 400));
  elements.push(furnitureElement('fur-sofa', 530, 450));
  elements.push(furnitureElement('fur-lounge-chair', 680, 360));
  elements.push(furnitureElement('fur-lamp', 760, 310));
  elements.push(furnitureElement('fur-plant', 470, 490));
  elements.push(furnitureElement('fur-bookcase', 700, 440));

  return elements;
}
