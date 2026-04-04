// Furniture assets - Gemini-generated top-down office icons
// Used in isometric template and furniture library
// Supports multiple themes (standard = free, others = Pro)

export type FurnitureTheme = 'standard' | 'modern' | 'japanese' | 'cyberpunk' | 'nature' | 'cafe';

export interface ThemeInfo {
  id: FurnitureTheme;
  name: string;
  description: string;
  proOnly: boolean;
}

export const THEMES: ThemeInfo[] = [
  { id: 'standard', name: 'スタンダード', description: '基本のオフィスアイコン', proOnly: false },
  { id: 'modern', name: 'モダン', description: 'ミニマル・ガラスデスク', proOnly: true },
  { id: 'japanese', name: '和室', description: '畳・盆栽・和風', proOnly: true },
  { id: 'cyberpunk', name: 'サイバーパンク', description: 'ネオン・ゲーミング', proOnly: true },
  { id: 'nature', name: 'ナチュラル', description: '木製・グリーン', proOnly: true },
  { id: 'cafe', name: 'カフェ', description: 'カフェ風・暖色', proOnly: true },
];

export interface FurnitureAsset {
  id: string;
  name: string;
  src: string;
  width: number;
  height: number;
  isSeat: boolean;
}

// Base furniture definitions (theme-agnostic, src is filled per theme)
const FURNITURE_DEFS: Omit<FurnitureAsset, 'src'>[] = [
  { id: 'fur-desk', name: 'デスク', width: 90, height: 51, isSeat: false },
  { id: 'fur-chair', name: 'チェア(下向き)', width: 22, height: 35, isSeat: true },
  { id: 'fur-chair-up', name: 'チェア(上向き)', width: 22, height: 35, isSeat: true },
  { id: 'fur-chair-left', name: 'チェア(左向き)', width: 35, height: 22, isSeat: true },
  { id: 'fur-chair-right', name: 'チェア(右向き)', width: 35, height: 22, isSeat: true },
  { id: 'fur-table-round', name: '丸テーブル', width: 65, height: 65, isSeat: false },
  { id: 'fur-table-rect', name: '長テーブル', width: 90, height: 62, isSeat: false },
  { id: 'fur-sofa', name: 'ソファ', width: 55, height: 54, isSeat: true },
  { id: 'fur-armchair', name: 'アームチェア', width: 40, height: 40, isSeat: true },
  { id: 'fur-plant', name: '観葉植物', width: 35, height: 33, isSeat: false },
  { id: 'fur-bookshelf', name: '本棚', width: 70, height: 55, isSeat: false },
  { id: 'fur-whiteboard', name: 'ホワイトボード', width: 80, height: 49, isSeat: false },
  { id: 'fur-coffee', name: 'コーヒーマシン', width: 25, height: 24, isSeat: false },
  { id: 'fur-monitor', name: 'モニター', width: 30, height: 29, isSeat: false },
  { id: 'fur-partition', name: 'パーティション', width: 90, height: 16, isSeat: false },
  { id: 'fur-rug', name: 'ラグ', width: 85, height: 64, isSeat: false },
  { id: 'fur-laptop', name: 'ラップトップ', width: 35, height: 29, isSeat: false },
  { id: 'fur-printer', name: 'プリンター', width: 35, height: 30, isSeat: false },
];

// Map theme → directory name
function themeDir(theme: FurnitureTheme): string {
  if (theme === 'standard') return 'furniture-topdown';
  return `furniture-${theme}`;
}

// Get file name from furniture id
function furnitureFileName(id: string): string {
  return id.replace('fur-', '') + '.png';
}

export function getFurnitureAssets(theme: FurnitureTheme = 'standard'): FurnitureAsset[] {
  const dir = `/assets/${themeDir(theme)}`;
  return FURNITURE_DEFS.map(def => ({
    ...def,
    src: `${dir}/${furnitureFileName(def.id)}`,
  }));
}

// Backward-compatible export — defaults to standard theme
export const FURNITURE_ASSETS: FurnitureAsset[] = getFurnitureAssets('standard');

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
let _cachedTheme: FurnitureTheme | null = null;
let _cachedFiles: Record<string, FileEntry> | null = null;
let _loadingPromise: Promise<Record<string, FileEntry>> | null = null;

export async function preloadFurnitureFiles(theme: FurnitureTheme = 'standard'): Promise<Record<string, FileEntry>> {
  // Return cache if same theme
  if (_cachedFiles && _cachedTheme === theme) return _cachedFiles;

  // If loading a different theme, reset
  if (_cachedTheme !== theme) {
    _cachedFiles = null;
    _loadingPromise = null;
  }
  if (_loadingPromise) return _loadingPromise;

  _cachedTheme = theme;
  const assets = getFurnitureAssets(theme);

  _loadingPromise = (async () => {
    const entries = await Promise.all(
      assets.map(async (asset) => {
        try {
          const dataURL = await fetchAsDataURL(asset.src);
          return [asset.id, { id: asset.id, dataURL, mimeType: 'image/png' as const, created: Date.now() }] as const;
        } catch {
          // Fallback to standard theme if premium theme image not found
          if (theme !== 'standard') {
            const fallbackSrc = `/assets/furniture-topdown/${furnitureFileName(asset.id)}`;
            const dataURL = await fetchAsDataURL(fallbackSrc);
            return [asset.id, { id: asset.id, dataURL, mimeType: 'image/png' as const, created: Date.now() }] as const;
          }
          throw new Error(`Failed to load ${asset.src}`);
        }
      })
    );
    _cachedFiles = Object.fromEntries(entries);
    return _cachedFiles;
  })();

  return _loadingPromise as Promise<NonNullable<typeof _cachedFiles>>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function registerFurnitureFiles(api: any, theme: FurnitureTheme = 'standard') {
  const filesMap = await preloadFurnitureFiles(theme);
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

// Generate starter floor — room frames only, user adds furniture via SpaceWizard
export function generateIsometricDemoFloor() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const elements: any[] = [];

  // 3 empty room frames for the user to fill
  elements.push(...room('ワークスペース', 30, 30, 400, 300));
  elements.push(...room('会議室', 460, 30, 280, 250));
  elements.push(...room('ラウンジ', 460, 310, 280, 240));

  return elements;
}
