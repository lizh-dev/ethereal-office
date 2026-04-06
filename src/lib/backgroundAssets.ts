// Floor background images - oVice-style illustrated backgrounds
// Users place PNG/JPG files in /public/assets/backgrounds/
// Then register them here with dimensions and metadata

export type BackgroundCategory = 'office' | 'cafe' | 'school' | 'event' | 'creative' | 'minimal';

export interface FloorBackground {
  id: string;
  name: string;
  src: string;
  width: number;
  height: number;
  category: BackgroundCategory;
  proOnly: boolean;
}

export const BACKGROUND_CATEGORIES: Record<BackgroundCategory, string> = {
  office: 'オフィス',
  cafe: 'カフェ',
  school: '教育',
  event: 'イベント',
  creative: 'クリエイティブ',
  minimal: 'シンプル',
};

// Register background images here.
// Place PNG/JPG files in /public/assets/backgrounds/ and add entries below.
// Recommended: 1200x640 ~ 2400x1280, 16:9 ratio, under 10MB
export const FLOOR_BACKGROUNDS: FloorBackground[] = [
  { id: 'bg-office-svg', name: 'オフィス (テスト)', src: '/assets/backgrounds/test-office.svg', width: 1200, height: 640, category: 'office', proOnly: false },
  { id: 'bg-photo-test', name: '写真背景 (テスト)', src: '/assets/backgrounds/test-office.jpg', width: 1200, height: 640, category: 'minimal', proOnly: false },
];

// Locked background element ID convention
export const BG_ELEMENT_ID = 'bg-locked-image';

async function fetchAsDataURL(src: string): Promise<string> {
  const res = await fetch(src);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

type FileEntry = { id: string; dataURL: string; mimeType: string; created: number };

let _cachedBg: string | null = null;
let _cachedFile: FileEntry | null = null;

export async function loadBackgroundFile(bg: FloorBackground): Promise<FileEntry> {
  if (_cachedBg === bg.id && _cachedFile) return _cachedFile;

  const dataURL = await fetchAsDataURL(bg.src);
  const mimeType = bg.src.endsWith('.jpg') || bg.src.endsWith('.jpeg') ? 'image/jpeg' : 'image/png';
  _cachedBg = bg.id;
  _cachedFile = { id: bg.id, dataURL, mimeType, created: Date.now() };
  return _cachedFile;
}

// Create the locked background Excalidraw element
export function createBackgroundElement(bg: FloorBackground): Record<string, unknown> {
  return {
    id: BG_ELEMENT_ID,
    type: 'image',
    x: 0,
    y: 0,
    width: bg.width,
    height: bg.height,
    fileId: bg.id,
    status: 'saved',
    locked: true,
    strokeColor: 'transparent',
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 0,
    roundness: null,
    opacity: 100,
  };
}
