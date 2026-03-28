// DiceBear avatar API + asset utilities

const imageCache = new Map<string, HTMLImageElement>();

function loadImage(url: string): Promise<HTMLImageElement> {
  if (imageCache.has(url)) return Promise.resolve(imageCache.get(url)!);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { imageCache.set(url, img); resolve(img); };
    img.onerror = () => resolve(img);
    img.src = url;
  });
}

export const AVATAR_STYLES = [
  { id: 'notionists' as const, label: 'ノーショニスト' },
  { id: 'avataaars' as const, label: 'アバターズ' },
  { id: 'big-smile' as const, label: 'ビッグスマイル' },
  { id: 'adventurer' as const, label: 'アドベンチャー' },
  { id: 'personas' as const, label: 'ペルソナ' },
  { id: 'lorelei' as const, label: 'ロレライ' },
];

export const AVATAR_SEEDS = [
  'tanaka', 'suzuki', 'sato', 'yamada', 'ito', 'watanabe',
  'nakamura', 'kobayashi', 'kato', 'yoshida', 'matsumoto', 'inoue',
  'kimura', 'hayashi', 'shimizu', 'takahashi', 'sakura', 'hana',
  'yuki', 'haruto', 'sota', 'mio', 'rin', 'aoi',
];

export function getAvatarUrl(seed: string, style: string = 'notionists'): string {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&radius=50`;
}

export async function loadAvatar(seed: string, style: string = 'notionists'): Promise<HTMLImageElement> {
  return loadImage(getAvatarUrl(seed, style));
}

export async function preloadAvatars(users: { name: string; avatarSeed?: string; avatarStyle?: string }[]): Promise<Record<string, HTMLImageElement>> {
  const result: Record<string, HTMLImageElement> = {};
  await Promise.all(
    users.map(async (u) => {
      const seed = u.avatarSeed || u.name;
      const style = u.avatarStyle || 'notionists';
      result[u.name] = await loadAvatar(seed, style);
    })
  );
  return result;
}

export { loadImage, imageCache };
