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
  { id: 'fur-chair', name: 'チェア(下向き)', src: '/assets/furniture-topdown/chair-down.png', width: 22, height: 35, isSeat: true },
  { id: 'fur-chair-up', name: 'チェア(上向き)', src: '/assets/furniture-topdown/chair-up.png', width: 22, height: 35, isSeat: true },
  { id: 'fur-chair-left', name: 'チェア(左向き)', src: '/assets/furniture-topdown/chair-left.png', width: 35, height: 22, isSeat: true },
  { id: 'fur-chair-right', name: 'チェア(右向き)', src: '/assets/furniture-topdown/chair-right.png', width: 35, height: 22, isSeat: true },
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

// Pre-load all furniture images as data URLs
// Returns a map of { fileId: { id, dataURL, mimeType, created } }
type FileEntry = { id: string; dataURL: string; mimeType: string; created: number };
let _cachedFiles: Record<string, FileEntry> | null = null;
let _loadingPromise: Promise<Record<string, FileEntry>> | null = null;

export async function preloadFurnitureFiles(): Promise<Record<string, FileEntry>> {
  if (_cachedFiles) return _cachedFiles;
  if (_loadingPromise) return _loadingPromise;

  _loadingPromise = (async () => {
    const entries = await Promise.all(
      FURNITURE_ASSETS.map(async (asset) => {
        const dataURL = await fetchAsDataURL(asset.src);
        return [asset.id, { id: asset.id, dataURL, mimeType: 'image/png' as const, created: Date.now() }] as const;
      })
    );
    _cachedFiles = Object.fromEntries(entries);
    return _cachedFiles;
  })();

  return _loadingPromise as Promise<NonNullable<typeof _cachedFiles>>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function registerFurnitureFiles(api: any) {
  const filesMap = await preloadFurnitureFiles();
  api.addFiles(Object.values(filesMap));
  return filesMap;
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

  // Desk: 90x51, Chair(up): 22x35, Monitor: 30x29
  const deskW = 90, deskH = 51, chairW = 22, chairH = 35, monW = 30;
  const chairGap = 8;
  const rowGap = 30;

  // ===== Workspace (4 desk+chair sets in 2 rows) =====
  const ws = { x: 30, y: 30, w: 380, h: 330 };
  elements.push(...room('ワークスペース', ws.x, ws.y, ws.w, ws.h));

  // Helper: desk set at position, chair centered below desk
  function deskSet(dx: number, dy: number) {
    elements.push(fur('fur-desk', dx, dy));
    elements.push(fur('fur-monitor', dx + (deskW - monW) / 2, dy + 5));
    elements.push(fur('fur-chair-up', dx + (deskW - chairW) / 2, dy + deskH + chairGap));
  }

  const r1y = ws.y + 35;
  deskSet(55, r1y);
  deskSet(210, r1y);

  const r2y = r1y + deskH + chairGap + chairH + rowGap;
  deskSet(55, r2y);
  deskSet(210, r2y);

  elements.push(fur('fur-desk', 240, r2y));
  elements.push(fur('fur-monitor', 270, r2y + 5));
  elements.push(fur('fur-chair-up', 269, r2y + deskH + chairGap));

  // Decorations
  elements.push(fur('fur-plant', 185, r1y));
  elements.push(fur('fur-plant', ws.x + ws.w - 45, ws.y + 10));

  // ===== Meeting Room =====
  const mr = { x: 480, y: 30, w: 320, h: 250 };
  elements.push(...room('会議室', mr.x, mr.y, mr.w, mr.h));

  // Table centered
  const tblW = 65, tblH = 65;
  const tblX = mr.x + (mr.w - tblW) / 2;
  const tblY = mr.y + (mr.h - tblH) / 2;
  elements.push(fur('fur-table-round', tblX, tblY));

  // Chairs centered on each side of table with gap
  const mtgGap = 10;
  elements.push(fur('fur-chair', tblX + (tblW - chairW) / 2, tblY - chairH - mtgGap));           // top
  elements.push(fur('fur-chair-up', tblX + (tblW - chairW) / 2, tblY + tblH + mtgGap));          // bottom
  elements.push(fur('fur-chair-right', tblX - 35 - mtgGap, tblY + (tblH - 22) / 2));             // left (35x22)
  elements.push(fur('fur-chair-left', tblX + tblW + mtgGap, tblY + (tblH - 22) / 2));            // right (35x22)

  elements.push(fur('fur-whiteboard', mr.x + 15, mr.y + mr.h - 60));
  elements.push(textEl(mr.x + 20, mr.y + mr.h - 8, 'ホワイトボード'));
  elements.push(fur('fur-plant', mr.x + mr.w - 45, mr.y + 10));

  // ===== Lounge =====
  const lg = { x: 480, y: 310, w: 320, h: 240 };
  elements.push(...room('ラウンジ', lg.x, lg.y, lg.w, lg.h));

  elements.push(fur('fur-sofa', lg.x + 30, lg.y + 50));
  elements.push(fur('fur-sofa', lg.x + 30, lg.y + 150));
  elements.push(fur('fur-armchair', lg.x + 180, lg.y + 80));
  elements.push(fur('fur-armchair', lg.x + 180, lg.y + 150));
  elements.push(fur('fur-bookshelf', lg.x + 120, lg.y + 40));
  elements.push(textEl(lg.x + 130, lg.y + 98, '本棚'));
  elements.push(fur('fur-coffee', lg.x + 250, lg.y + 40));
  elements.push(textEl(lg.x + 240, lg.y + 65, 'コーヒー'));
  elements.push(fur('fur-plant', lg.x + lg.w - 45, lg.y + 10));
  elements.push(fur('fur-plant', lg.x + 20, lg.y + lg.h - 40));

  return elements;
}

function textEl(x: number, y: number, text: string) {
  return { type: 'text', x, y, text, fontSize: 10, strokeColor: '#94a3b8' };
}
