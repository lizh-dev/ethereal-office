import type { FurnitureTheme } from '@/lib/furnitureAssets';

export type TemplateCategory =
  | 'startup' | 'corporate' | 'education' | 'creative'
  | 'engineering' | 'coworking' | 'event' | 'support'
  | 'hybrid' | 'minimal';

export type TeamSize = 'xs' | 'small' | 'medium' | 'large';

export interface ZoneDef {
  type: 'desk-area' | 'meeting' | 'lounge' | 'cafe' | 'classroom' | 'reception';
  mode?: 'room' | 'set'; // 'room' = with roomBox (default), 'set' = furniture only, no room box
  quantity?: number;      // for 'set' mode: how many instances to place
  name: string;
  rows?: number;
  cols?: number;
  seats?: number;
  spacing?: number;
  deskLayout?: 'single' | 'facing';
}

export interface TemplateDef {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  teamSize: TeamSize;
  theme: FurnitureTheme;
  seatCount: number;
  proOnly: boolean;
  zones: ZoneDef[];
}

export const CATEGORY_INFO: Record<TemplateCategory, { label: string; icon: string }> = {
  startup: { label: 'スタートアップ', icon: '🚀' },
  corporate: { label: '企業オフィス', icon: '🏢' },
  education: { label: '教育・塾', icon: '📚' },
  creative: { label: 'クリエイティブ', icon: '🎨' },
  engineering: { label: 'エンジニアリング', icon: '💻' },
  coworking: { label: 'コワーキング', icon: '🏠' },
  event: { label: 'イベント', icon: '🎤' },
  support: { label: 'サポート', icon: '🎧' },
  hybrid: { label: 'ハイブリッド', icon: '🔄' },
  minimal: { label: 'ミニマル', icon: '✨' },
};

export const TEAM_SIZE_INFO: Record<TeamSize, { label: string; range: string }> = {
  xs: { label: '極小', range: '1-3人' },
  small: { label: '小規模', range: '4-8人' },
  medium: { label: '中規模', range: '9-20人' },
  large: { label: '大規模', range: '20人+' },
};

// Seat count helpers (match SpaceWizard logic):
// desk-area facing: rows * cols * 2
// desk-area single: rows * cols
// meeting: seats * 2 + (seats > 3 ? 2 : 0)
// lounge: 3 (fixed)
// cafe: rows * cols * 2
// classroom: rows * cols
// reception: 3 (fixed)

function countSeats(zones: ZoneDef[]): number {
  let total = 0;
  for (const z of zones) {
    switch (z.type) {
      case 'desk-area':
        if (z.deskLayout === 'single') {
          total += (z.rows ?? 1) * (z.cols ?? 1);
        } else {
          total += (z.rows ?? 1) * (z.cols ?? 1) * 2;
        }
        break;
      case 'meeting':
        total += (z.seats ?? 2) * 2 + ((z.seats ?? 2) > 3 ? 2 : 0);
        break;
      case 'lounge':
        total += 3;
        break;
      case 'cafe':
        total += (z.rows ?? 1) * (z.cols ?? 1) * 2;
        break;
      case 'classroom':
        total += (z.rows ?? 1) * (z.cols ?? 1);
        break;
      case 'reception':
        total += 3;
        break;
    }
  }
  return total;
}

function t(
  id: string,
  name: string,
  description: string,
  category: TemplateCategory,
  teamSize: TeamSize,
  theme: FurnitureTheme,
  zones: ZoneDef[],
): TemplateDef {
  return {
    id,
    name,
    description,
    category,
    teamSize,
    theme,
    seatCount: countSeats(zones),
    proOnly: theme !== 'standard',
    zones,
  };
}

export const TEMPLATE_CATALOG: TemplateDef[] = [
  // ═══════════════════════════════════════════════════════════════
  // Minimal (7)
  // ═══════════════════════════════════════════════════════════════
  t('minimal-1-solo', 'ソロワーク', '一人用の最小デスク', 'minimal', 'xs', 'standard', [
    { type: 'desk-area', name: 'デスク', rows: 1, cols: 1, deskLayout: 'single' },
  ]),
  t('minimal-2-pair', 'ペアデスク', '二人用の対面デスク', 'minimal', 'xs', 'standard', [
    { type: 'desk-area', name: 'ペアデスク', rows: 1, cols: 1, deskLayout: 'facing' },
  ]),
  t('minimal-3-triangle', 'トライアングル', '3人チーム用デスク+ミーティング', 'minimal', 'xs', 'standard', [
    { type: 'desk-area', name: 'デスク', rows: 1, cols: 1, deskLayout: 'single' },
    { type: 'meeting', name: 'ミーティング', seats: 1 },
  ]),
  t('minimal-2-cafe', 'カフェスタイル 2人', '2人用カフェテーブル', 'minimal', 'xs', 'standard', [
    { type: 'cafe', name: 'カフェ席', rows: 1, cols: 1 },
  ]),
  t('minimal-3-lounge', 'ラウンジ 3人', 'ソファとアームチェアの寛ぎ空間', 'minimal', 'xs', 'standard', [
    { type: 'lounge', name: 'ラウンジ' },
  ]),
  t('minimal-4-compact', 'コンパクト 4人', '最小構成の4人オフィス', 'minimal', 'small', 'standard', [
    { type: 'desk-area', name: 'デスク', rows: 1, cols: 2, deskLayout: 'facing' },
  ]),
  t('minimal-6-basic', 'ベーシック 6人', 'シンプルな6人デスク', 'minimal', 'small', 'standard', [
    { type: 'desk-area', name: 'デスク', rows: 1, cols: 3, deskLayout: 'facing' },
  ]),

  // ═══════════════════════════════════════════════════════════════
  // Startup (12)
  // ═══════════════════════════════════════════════════════════════
  t('startup-4-standard', 'スタートアップ 4人チーム', '小さなチームのデスク+会議', 'startup', 'small', 'standard', [
    { type: 'desk-area', name: 'ワークスペース', rows: 1, cols: 2, deskLayout: 'facing' },
    { type: 'meeting', name: 'ミーティング', seats: 2 },
  ]),
  t('startup-6-standard', 'スタートアップ 6人チーム', 'デスク+ラウンジ付き', 'startup', 'small', 'standard', [
    { type: 'desk-area', name: 'ワークスペース', rows: 1, cols: 3, deskLayout: 'facing' },
    { type: 'lounge', name: '休憩スペース' },
  ]),
  t('startup-8-standard', 'スタートアップ 8人', 'フル装備の小規模オフィス', 'startup', 'small', 'standard', [
    { type: 'desk-area', name: 'ワークスペース', rows: 1, cols: 3, deskLayout: 'facing' },
    { type: 'meeting', name: '会議室', seats: 1 },
  ]),
  t('startup-10-standard', 'スタートアップ 10人', 'デスク+会議+カフェ', 'startup', 'medium', 'standard', [
    { type: 'desk-area', name: 'ワークスペース', rows: 1, cols: 3, deskLayout: 'facing' },
    { type: 'meeting', name: '会議室', seats: 2 },
  ]),
  t('startup-12-modern', 'モダンスタートアップ 12人', 'モダンテーマの成長期チーム', 'startup', 'medium', 'modern', [
    { type: 'desk-area', name: 'ワークスペース', rows: 2, cols: 3, deskLayout: 'facing' },
  ]),
  t('startup-8-nature', 'グリーンスタートアップ 8人', 'ナチュラルテーマで快適空間', 'startup', 'small', 'nature', [
    { type: 'desk-area', name: 'ワークスペース', rows: 1, cols: 2, deskLayout: 'facing' },
    { type: 'lounge', name: 'グリーンラウンジ' },
    { type: 'cafe', name: 'カフェコーナー', rows: 1, cols: 1 },
  ]),
  t('startup-6-cafe', 'カフェ風スタートアップ', 'カフェテーマのカジュアルオフィス', 'startup', 'small', 'cafe', [
    { type: 'desk-area', name: 'ワークスペース', rows: 1, cols: 2, deskLayout: 'facing' },
    { type: 'cafe', name: 'カフェスペース', rows: 1, cols: 1 },
  ]),
  t('startup-14-standard', 'スタートアップ 14人', '2部門構成の成長チーム', 'startup', 'medium', 'standard', [
    { type: 'desk-area', name: '開発チーム', rows: 1, cols: 3, deskLayout: 'facing' },
    { type: 'desk-area', name: 'ビジネスチーム', rows: 1, cols: 2, deskLayout: 'facing' },
    { type: 'meeting', name: '会議室', seats: 2 },
  ]),
  t('startup-16-modern', 'モダンスタートアップ 16人', '急成長チーム向けモダン空間', 'startup', 'medium', 'modern', [
    { type: 'desk-area', name: 'チームA', rows: 2, cols: 2, deskLayout: 'facing' },
    { type: 'desk-area', name: 'チームB', rows: 2, cols: 2, deskLayout: 'facing' },
  ]),
  t('startup-10-lounge', 'リラックススタートアップ', 'ラウンジ重視のオフィス', 'startup', 'medium', 'standard', [
    { type: 'desk-area', name: 'ワークスペース', rows: 1, cols: 2, deskLayout: 'facing' },
    { type: 'lounge', name: 'メインラウンジ' },
    { type: 'meeting', name: 'ハドル', seats: 1 },
  ]),
  t('startup-20-standard', 'スタートアップ 20人', '3チーム構成の拡大期', 'startup', 'medium', 'standard', [
    { type: 'desk-area', name: 'エンジニア', rows: 1, cols: 3, deskLayout: 'facing' },
    { type: 'desk-area', name: 'デザイン', rows: 1, cols: 2, deskLayout: 'facing' },
    { type: 'meeting', name: '会議室', seats: 2 },
    { type: 'lounge', name: '休憩室' },
  ]),
  t('startup-5-reception', 'スタートアップ 受付付き', '受付のある小さなオフィス', 'startup', 'small', 'standard', [
    { type: 'reception', name: '受付' },
    { type: 'desk-area', name: 'ワークスペース', rows: 1, cols: 1, deskLayout: 'facing' },
  ]),

  // ═══════════════════════════════════════════════════════════════
  // Corporate (15)
  // ═══════════════════════════════════════════════════════════════
  t('corp-10-standard', '企業オフィス 10人', '基本の企業フロア', 'corporate', 'medium', 'standard', [
    { type: 'desk-area', name: 'オープンスペース', rows: 1, cols: 3, deskLayout: 'facing' },
    { type: 'meeting', name: '会議室A', seats: 2 },
  ]),
  t('corp-20-standard', '企業オフィス 20人', '中規模部門フロア', 'corporate', 'medium', 'standard', [
    { type: 'desk-area', name: 'ワークエリア', rows: 2, cols: 3, deskLayout: 'facing' },
    { type: 'meeting', name: '会議室', seats: 3 },
    { type: 'lounge', name: '休憩コーナー' },
  ]),
  t('corp-30-standard', '企業オフィス 30人', '大規模オープンプラン', 'corporate', 'large', 'standard', [
    { type: 'desk-area', name: 'フロアA', rows: 2, cols: 4, deskLayout: 'facing' },
    { type: 'desk-area', name: 'フロアB', rows: 1, cols: 3, deskLayout: 'facing' },
    { type: 'meeting', name: '大会議室', seats: 4 },
  ]),
  t('corp-exec-standard', 'エグゼクティブフロア', '役員フロア+受付', 'corporate', 'medium', 'standard', [
    { type: 'reception', name: '受付', },
    { type: 'desk-area', name: '役員デスク', rows: 1, cols: 3, deskLayout: 'single' },
    { type: 'meeting', name: '役員会議室', seats: 3 },
    { type: 'lounge', name: 'VIPラウンジ' },
  ]),
  t('corp-dept-sales', '営業部フロア', '営業チーム+会議室2つ', 'corporate', 'large', 'standard', [
    { type: 'desk-area', name: '営業1課', rows: 2, cols: 3, deskLayout: 'facing' },
    { type: 'desk-area', name: '営業2課', rows: 2, cols: 3, deskLayout: 'facing' },
    { type: 'meeting', name: '商談室A', seats: 2 },
    { type: 'meeting', name: '商談室B', seats: 2 },
  ]),
  t('corp-dept-hr', '人事部フロア', '人事+面接室+受付', 'corporate', 'medium', 'standard', [
    { type: 'reception', name: '受付' },
    { type: 'desk-area', name: '人事チーム', rows: 1, cols: 3, deskLayout: 'facing' },
    { type: 'meeting', name: '面接室', seats: 2 },
  ]),
  t('corp-15-modern', 'モダン企業 15人', 'モダンテーマの洗練オフィス', 'corporate', 'medium', 'modern', [
    { type: 'desk-area', name: 'ワークエリア', rows: 1, cols: 4, deskLayout: 'facing' },
    { type: 'meeting', name: '会議室', seats: 3 },
    { type: 'lounge', name: 'ラウンジ' },
  ]),
  t('corp-25-modern', 'モダン企業 25人', 'モダンテーマの大規模オフィス', 'corporate', 'large', 'modern', [
    { type: 'desk-area', name: 'メインフロア', rows: 2, cols: 4, deskLayout: 'facing' },
    { type: 'meeting', name: '会議室A', seats: 3 },
    { type: 'meeting', name: '会議室B', seats: 2 },
    { type: 'lounge', name: '社員ラウンジ' },
  ]),
  t('corp-openplan-40', 'オープンプラン 40人', '大フロアのオープンプラン', 'corporate', 'large', 'standard', [
    { type: 'desk-area', name: 'エリアA', rows: 2, cols: 5, deskLayout: 'facing' },
    { type: 'desk-area', name: 'エリアB', rows: 2, cols: 5, deskLayout: 'facing' },
  ]),
  t('corp-hq-50', '本社フロア 50人', '本社レベルのフル装備', 'corporate', 'large', 'standard', [
    { type: 'desk-area', name: 'メインエリア', rows: 3, cols: 5, deskLayout: 'facing' },
    { type: 'meeting', name: '大会議室', seats: 5 },
    { type: 'meeting', name: '小会議室', seats: 2 },
    { type: 'lounge', name: '社員ラウンジ' },
    { type: 'cafe', name: 'カフェテリア', rows: 1, cols: 2 },
  ]),
  t('corp-reception-standard', '企業受付フロア', '受付+応接+ワークエリア', 'corporate', 'medium', 'standard', [
    { type: 'reception', name: 'エントランス受付' },
    { type: 'desk-area', name: 'ワークエリア', rows: 1, cols: 3, deskLayout: 'facing' },
    { type: 'meeting', name: '応接室', seats: 2 },
  ]),
  t('corp-multiroom-standard', '複数会議室フロア', '会議室中心のフロア構成', 'corporate', 'medium', 'standard', [
    { type: 'desk-area', name: 'ワークエリア', rows: 1, cols: 2, deskLayout: 'facing' },
    { type: 'meeting', name: '会議室A', seats: 3 },
    { type: 'meeting', name: '会議室B', seats: 2 },
    { type: 'meeting', name: 'ハドルルーム', seats: 1 },
  ]),
  t('corp-cafe-standard', '企業カフェ付きフロア', 'カフェテリア併設の企業フロア', 'corporate', 'large', 'standard', [
    { type: 'desk-area', name: 'ワークエリア', rows: 2, cols: 4, deskLayout: 'facing' },
    { type: 'cafe', name: '社員食堂', rows: 2, cols: 3 },
    { type: 'lounge', name: 'リフレッシュルーム' },
  ]),
  t('corp-compact-modern', 'コンパクト企業 モダン', '少人数の洗練オフィス', 'corporate', 'small', 'modern', [
    { type: 'desk-area', name: 'デスク', rows: 1, cols: 2, deskLayout: 'facing' },
    { type: 'meeting', name: 'ミーティング', seats: 2 },
  ]),
  t('corp-tower-standard', 'タワーオフィス', '高層ビル型の効率フロア', 'corporate', 'large', 'standard', [
    { type: 'desk-area', name: 'Aブロック', rows: 2, cols: 3, deskLayout: 'facing' },
    { type: 'desk-area', name: 'Bブロック', rows: 2, cols: 3, deskLayout: 'facing' },
    { type: 'meeting', name: '会議室', seats: 4 },
    { type: 'reception', name: '受付' },
  ]),

  // ═══════════════════════════════════════════════════════════════
  // Education (10)
  // ═══════════════════════════════════════════════════════════════
  t('edu-classroom-12', '教室型 12席', '3列4行の標準教室', 'education', 'medium', 'standard', [
    { type: 'classroom', name: '教室', rows: 3, cols: 4 },
  ]),
  t('edu-classroom-20', '教室型 20席', '4列5行の大教室', 'education', 'large', 'standard', [
    { type: 'classroom', name: '教室', rows: 4, cols: 5 },
  ]),
  t('edu-tutorial-1on1', '個別指導 1対1', '先生と生徒のペアデスク', 'education', 'xs', 'standard', [
    { type: 'desk-area', name: '指導デスク', rows: 1, cols: 1, deskLayout: 'facing' },
    { type: 'meeting', name: '相談コーナー', seats: 1 },
  ]),
  t('edu-seminar-8', 'セミナールーム 8人', 'セミナー形式の教室', 'education', 'small', 'standard', [
    { type: 'classroom', name: 'セミナー室', rows: 2, cols: 4 },
  ]),
  t('edu-juku-6-japanese', '塾 6人教室 和室', '和室テーマの塾教室', 'education', 'small', 'japanese', [
    { type: 'classroom', name: '教室', rows: 2, cols: 3 },
  ]),
  t('edu-juku-12-japanese', '塾 12人教室 和室', '和室テーマの中規模教室', 'education', 'medium', 'japanese', [
    { type: 'classroom', name: '教室', rows: 3, cols: 4 },
  ]),
  t('edu-study-4', '自習室 4人', '集中できる自習スペース', 'education', 'small', 'standard', [
    { type: 'desk-area', name: '自習スペース', rows: 2, cols: 2, deskLayout: 'single' },
  ]),
  t('edu-study-8', '自習室 8人', '大きめの自習スペース', 'education', 'small', 'standard', [
    { type: 'desk-area', name: '自習スペース', rows: 2, cols: 4, deskLayout: 'single' },
  ]),
  t('edu-school-complex', '学校複合フロア', '教室+職員室+相談室', 'education', 'large', 'standard', [
    { type: 'classroom', name: '教室', rows: 4, cols: 5 },
    { type: 'desk-area', name: '職員室', rows: 1, cols: 3, deskLayout: 'facing' },
    { type: 'meeting', name: '相談室', seats: 2 },
  ]),
  t('edu-language-japanese', '語学教室 和室', '語学レッスン向けの和室空間', 'education', 'small', 'japanese', [
    { type: 'classroom', name: '語学教室', rows: 2, cols: 3 },
    { type: 'lounge', name: '休憩スペース' },
  ]),

  // ═══════════════════════════════════════════════════════════════
  // Engineering (12)
  // ═══════════════════════════════════════════════════════════════
  t('eng-pair-2', 'ペアプログラミング', '2人用の対面デスク', 'engineering', 'xs', 'standard', [
    { type: 'desk-area', name: 'ペアデスク', rows: 1, cols: 1, deskLayout: 'facing' },
  ]),
  t('eng-scrum-6', 'スクラムチーム 6人', 'アジャイルチーム用', 'engineering', 'small', 'standard', [
    { type: 'desk-area', name: '開発エリア', rows: 1, cols: 3, deskLayout: 'facing' },
    { type: 'meeting', name: 'スタンドアップ', seats: 1 },
  ]),
  t('eng-scrum-10', 'スクラムチーム 10人', '大きめのアジャイルチーム', 'engineering', 'medium', 'standard', [
    { type: 'desk-area', name: '開発エリア', rows: 1, cols: 4, deskLayout: 'facing' },
    { type: 'meeting', name: 'スプリントレビュー', seats: 1 },
  ]),
  t('eng-devroom-12-cyberpunk', 'サイバー開発室 12人', 'サイバーパンクの開発拠点', 'engineering', 'medium', 'cyberpunk', [
    { type: 'desk-area', name: '開発フロア', rows: 2, cols: 3, deskLayout: 'facing' },
  ]),
  t('eng-lab-8-cyberpunk', 'サイバーラボ 8人', 'ネオンの研究室', 'engineering', 'small', 'cyberpunk', [
    { type: 'desk-area', name: 'ラボ', rows: 1, cols: 2, deskLayout: 'facing' },
    { type: 'meeting', name: 'ディスカッション', seats: 2 },
  ]),
  t('eng-fullstack-16', 'フルスタック 16人', 'フロント+バック分離チーム', 'engineering', 'medium', 'standard', [
    { type: 'desk-area', name: 'フロントエンド', rows: 1, cols: 3, deskLayout: 'facing' },
    { type: 'desk-area', name: 'バックエンド', rows: 1, cols: 3, deskLayout: 'facing' },
    { type: 'meeting', name: '技術ミーティング', seats: 2 },
  ]),
  t('eng-devops-10', 'DevOpsチーム 10人', 'インフラ+開発統合チーム', 'engineering', 'medium', 'standard', [
    { type: 'desk-area', name: 'DevOpsエリア', rows: 1, cols: 4, deskLayout: 'facing' },
    { type: 'meeting', name: '障害対応室', seats: 1 },
  ]),
  t('eng-hackspace-14', 'ハックスペース 14人', '自由なハッカソン空間', 'engineering', 'medium', 'standard', [
    { type: 'desk-area', name: 'ハックエリア', rows: 1, cols: 4, deskLayout: 'facing' },
    { type: 'cafe', name: 'エナジーカフェ', rows: 1, cols: 2 },
    { type: 'lounge', name: '仮眠スペース' },
  ]),
  t('eng-ai-lab-cyberpunk', 'AIラボ サイバー', 'AI研究チーム向けネオン空間', 'engineering', 'medium', 'cyberpunk', [
    { type: 'desk-area', name: 'GPU作業エリア', rows: 2, cols: 3, deskLayout: 'single' },
    { type: 'meeting', name: 'モデルレビュー', seats: 3 },
  ]),
  t('eng-mobile-8', 'モバイルチーム 8人', 'iOS/Android開発チーム', 'engineering', 'small', 'standard', [
    { type: 'desk-area', name: 'iOSチーム', rows: 1, cols: 2, deskLayout: 'facing' },
    { type: 'desk-area', name: 'Androidチーム', rows: 1, cols: 2, deskLayout: 'facing' },
  ]),
  t('eng-data-12-cyberpunk', 'データチーム サイバー', 'データサイエンス専用空間', 'engineering', 'medium', 'cyberpunk', [
    { type: 'desk-area', name: 'データ分析エリア', rows: 1, cols: 3, deskLayout: 'facing' },
    { type: 'meeting', name: 'ダッシュボードルーム', seats: 3 },
  ]),
  t('eng-startup-dev-20', '開発部門 20人', '技術部門のフル構成', 'engineering', 'large', 'standard', [
    { type: 'desk-area', name: 'チームA', rows: 2, cols: 3, deskLayout: 'facing' },
    { type: 'desk-area', name: 'チームB', rows: 1, cols: 3, deskLayout: 'facing' },
    { type: 'meeting', name: '技術会議室', seats: 2 },
    { type: 'lounge', name: 'デベロッパーラウンジ' },
  ]),

  // ═══════════════════════════════════════════════════════════════
  // Creative (10)
  // ═══════════════════════════════════════════════════════════════
  t('creative-studio-4', 'デザインスタジオ 4人', '小規模デザインチーム', 'creative', 'small', 'standard', [
    { type: 'desk-area', name: 'デザインデスク', rows: 1, cols: 2, deskLayout: 'facing' },
  ]),
  t('creative-studio-8-nature', 'ナチュラルスタジオ 8人', '自然テーマのクリエイティブ空間', 'creative', 'small', 'nature', [
    { type: 'desk-area', name: 'デザインエリア', rows: 1, cols: 2, deskLayout: 'facing' },
    { type: 'lounge', name: 'インスピレーションラウンジ' },
    { type: 'cafe', name: 'カフェコーナー', rows: 1, cols: 1 },
  ]),
  t('creative-art-6', 'アートルーム 6人', 'アーティスト向けオープンスペース', 'creative', 'small', 'standard', [
    { type: 'desk-area', name: 'アトリエ', rows: 1, cols: 3, deskLayout: 'single' },
    { type: 'lounge', name: 'ギャラリーラウンジ' },
  ]),
  t('creative-photo-5', 'フォトスタジオ 5人', '撮影+編集の複合スタジオ', 'creative', 'small', 'standard', [
    { type: 'desk-area', name: '編集デスク', rows: 1, cols: 1, deskLayout: 'facing' },
    { type: 'lounge', name: 'スタジオラウンジ' },
  ]),
  t('creative-agency-12-cafe', 'クリエイティブエージェンシー', 'カフェテーマの制作会社', 'creative', 'medium', 'cafe', [
    { type: 'desk-area', name: 'クリエイターデスク', rows: 1, cols: 3, deskLayout: 'facing' },
    { type: 'cafe', name: 'ブレストカフェ', rows: 1, cols: 2 },
    { type: 'meeting', name: 'プレゼンルーム', seats: 1 },
  ]),
  t('creative-music-4', '音楽スタジオ 4人', '音楽制作チーム用', 'creative', 'small', 'standard', [
    { type: 'desk-area', name: 'DAWデスク', rows: 1, cols: 2, deskLayout: 'single' },
    { type: 'lounge', name: 'リスニングルーム' },
  ]),
  t('creative-video-8-nature', '映像制作室 ナチュラル', '映像編集チーム向け', 'creative', 'small', 'nature', [
    { type: 'desk-area', name: '編集ブース', rows: 1, cols: 3, deskLayout: 'single' },
    { type: 'meeting', name: 'プレビュールーム', seats: 2 },
  ]),
  t('creative-design-16', 'デザイン部門 16人', '大規模デザインチーム', 'creative', 'medium', 'standard', [
    { type: 'desk-area', name: 'UIチーム', rows: 1, cols: 3, deskLayout: 'facing' },
    { type: 'desk-area', name: 'グラフィックチーム', rows: 1, cols: 2, deskLayout: 'facing' },
    { type: 'meeting', name: 'レビュールーム', seats: 2 },
  ]),
  t('creative-colab-10-cafe', 'コラボスペース カフェ', 'カフェテーマのコラボ空間', 'creative', 'medium', 'cafe', [
    { type: 'desk-area', name: '作業デスク', rows: 1, cols: 2, deskLayout: 'facing' },
    { type: 'cafe', name: 'コラボカフェ', rows: 1, cols: 2 },
    { type: 'lounge', name: 'リラックスゾーン' },
  ]),
  t('creative-gallery-6-nature', 'ギャラリーオフィス', 'ナチュラルテーマのギャラリー', 'creative', 'small', 'nature', [
    { type: 'desk-area', name: 'キュレーターデスク', rows: 1, cols: 1, deskLayout: 'facing' },
    { type: 'reception', name: 'ギャラリー受付' },
  ]),

  // ═══════════════════════════════════════════════════════════════
  // Coworking (10)
  // ═══════════════════════════════════════════════════════════════
  t('cowork-hotdesk-8', 'ホットデスク 8人', 'フリーアドレスの共有デスク', 'coworking', 'small', 'standard', [
    { type: 'desk-area', name: 'フリーデスク', rows: 2, cols: 2, deskLayout: 'facing' },
    { type: 'cafe', name: 'ドリンクバー', rows: 1, cols: 1 },
  ]),
  t('cowork-hotdesk-16', 'ホットデスク 16人', '大規模フリーアドレス', 'coworking', 'medium', 'standard', [
    { type: 'desk-area', name: 'フリーデスクA', rows: 2, cols: 2, deskLayout: 'facing' },
    { type: 'desk-area', name: 'フリーデスクB', rows: 2, cols: 2, deskLayout: 'facing' },
  ]),
  t('cowork-booth-6', 'プライベートブース 6人', '個室ブース型スペース', 'coworking', 'small', 'standard', [
    { type: 'desk-area', name: 'ブースA', rows: 1, cols: 3, deskLayout: 'single' },
    { type: 'desk-area', name: 'ブースB', rows: 1, cols: 3, deskLayout: 'single' },
  ]),
  t('cowork-lounge-cafe', 'コワーキングラウンジ', 'カフェテーマの共有スペース', 'coworking', 'small', 'cafe', [
    { type: 'lounge', name: 'ソファエリア' },
    { type: 'cafe', name: 'コーヒースタンド', rows: 1, cols: 2 },
  ]),
  t('cowork-mixed-12-modern', 'ミックス コワーキング', 'モダンテーマの複合型', 'coworking', 'medium', 'modern', [
    { type: 'desk-area', name: 'デスクエリア', rows: 1, cols: 2, deskLayout: 'facing' },
    { type: 'cafe', name: 'カフェラウンジ', rows: 1, cols: 2 },
    { type: 'meeting', name: '会議ブース', seats: 1 },
  ]),
  t('cowork-community-20', 'コミュニティスペース 20人', '大規模コワーキング', 'coworking', 'large', 'standard', [
    { type: 'desk-area', name: 'メインデスク', rows: 2, cols: 3, deskLayout: 'facing' },
    { type: 'cafe', name: 'コミュニティカフェ', rows: 1, cols: 2 },
    { type: 'lounge', name: 'ネットワーキングラウンジ' },
    { type: 'meeting', name: 'フォンブース', seats: 1 },
  ]),
  t('cowork-premium-cafe', 'プレミアム コワーキング', 'カフェテーマの高級共有空間', 'coworking', 'medium', 'cafe', [
    { type: 'desk-area', name: 'プレミアムデスク', rows: 1, cols: 3, deskLayout: 'single' },
    { type: 'lounge', name: 'VIPラウンジ' },
    { type: 'cafe', name: 'バリスタカフェ', rows: 1, cols: 2 },
  ]),
  t('cowork-study-8', 'スタディスペース 8人', '勉強・作業向け静音エリア', 'coworking', 'small', 'standard', [
    { type: 'desk-area', name: '集中デスク', rows: 2, cols: 4, deskLayout: 'single' },
  ]),
  t('cowork-flex-14-modern', 'フレックス コワーキング', 'モダンテーマの柔軟空間', 'coworking', 'medium', 'modern', [
    { type: 'desk-area', name: 'フレックスデスク', rows: 1, cols: 3, deskLayout: 'facing' },
    { type: 'meeting', name: 'ミーティングポッド', seats: 2 },
    { type: 'lounge', name: 'リラックスゾーン' },
  ]),
  t('cowork-nomad-6-cafe', 'ノマドカフェ', 'カフェテーマのノマドワーカー向け', 'coworking', 'small', 'cafe', [
    { type: 'cafe', name: 'カフェ席', rows: 1, cols: 2 },
    { type: 'desk-area', name: '電源デスク', rows: 1, cols: 1, deskLayout: 'single' },
    { type: 'lounge', name: 'ソファ席' },
  ]),

  // ═══════════════════════════════════════════════════════════════
  // Event (8)
  // ═══════════════════════════════════════════════════════════════
  t('event-conference-20', 'カンファレンス 20人', '大規模プレゼン会場', 'event', 'large', 'standard', [
    { type: 'classroom', name: 'メイン会場', rows: 4, cols: 5 },
  ]),
  t('event-conference-30', 'カンファレンス 30人', '大ホール型会場', 'event', 'large', 'standard', [
    { type: 'classroom', name: 'メインホール', rows: 5, cols: 6 },
  ]),
  t('event-workshop-12', 'ワークショップ 12人', '体験型ワークショップ', 'event', 'medium', 'standard', [
    { type: 'classroom', name: 'ワークショップ会場', rows: 3, cols: 4 },
  ]),
  t('event-workshop-8', 'ワークショップ 8人', '少人数ワークショップ', 'event', 'small', 'standard', [
    { type: 'classroom', name: '会場', rows: 2, cols: 4 },
  ]),
  t('event-exhibition-10', '展示会 10人', '展示+受付の複合イベント', 'event', 'medium', 'standard', [
    { type: 'reception', name: '受付', },
    { type: 'lounge', name: '展示エリアA' },
    { type: 'cafe', name: 'ドリンクコーナー', rows: 1, cols: 2 },
  ]),
  t('event-meetup-16', 'ミートアップ 16人', 'コミュニティミートアップ会場', 'event', 'medium', 'standard', [
    { type: 'classroom', name: 'プレゼンエリア', rows: 2, cols: 4 },
    { type: 'cafe', name: '懇親カフェ', rows: 1, cols: 2 },
  ]),
  t('event-seminar-hall', 'セミナーホール', 'セミナー+質疑応答', 'event', 'large', 'standard', [
    { type: 'classroom', name: 'セミナー会場', rows: 5, cols: 5 },
    { type: 'meeting', name: '質疑応答室', seats: 2 },
  ]),
  t('event-networking', 'ネットワーキング会場', '交流イベント向け', 'event', 'medium', 'standard', [
    { type: 'lounge', name: '交流ラウンジA' },
    { type: 'lounge', name: '交流ラウンジB' },
    { type: 'cafe', name: 'ドリンクバー', rows: 1, cols: 2 },
    { type: 'reception', name: '受付' },
  ]),

  // ═══════════════════════════════════════════════════════════════
  // Support (8)
  // ═══════════════════════════════════════════════════════════════
  t('support-callcenter-10', 'コールセンター 10人', '小規模コールセンター', 'support', 'medium', 'standard', [
    { type: 'desk-area', name: 'オペレーターデスク', rows: 2, cols: 5, deskLayout: 'single' },
  ]),
  t('support-callcenter-20', 'コールセンター 20人', '中規模コールセンター', 'support', 'large', 'standard', [
    { type: 'desk-area', name: 'オペレーターA', rows: 2, cols: 5, deskLayout: 'single' },
    { type: 'desk-area', name: 'オペレーターB', rows: 2, cols: 5, deskLayout: 'single' },
  ]),
  t('support-helpdesk-6', 'ヘルプデスク 6人', 'IT/サポートデスク', 'support', 'small', 'standard', [
    { type: 'desk-area', name: 'サポートデスク', rows: 1, cols: 3, deskLayout: 'facing' },
  ]),
  t('support-helpdesk-12-modern', 'モダン ヘルプデスク 12人', 'モダンテーマのサポート拠点', 'support', 'medium', 'modern', [
    { type: 'desk-area', name: 'サポートチーム', rows: 2, cols: 3, deskLayout: 'facing' },
  ]),
  t('support-cs-team-8', 'CSチーム 8人', 'カスタマーサクセスチーム', 'support', 'small', 'standard', [
    { type: 'desk-area', name: 'CSデスク', rows: 1, cols: 2, deskLayout: 'facing' },
    { type: 'meeting', name: 'エスカレーション室', seats: 2 },
  ]),
  t('support-center-24-modern', 'サポートセンター 24人', 'モダンテーマの大規模サポート', 'support', 'large', 'modern', [
    { type: 'desk-area', name: 'チーム1', rows: 2, cols: 3, deskLayout: 'facing' },
    { type: 'desk-area', name: 'チーム2', rows: 2, cols: 3, deskLayout: 'facing' },
  ]),
  t('support-reception-standard', 'サポート窓口', '受付+対応デスク', 'support', 'small', 'standard', [
    { type: 'reception', name: '受付窓口' },
    { type: 'desk-area', name: '対応デスク', rows: 1, cols: 2, deskLayout: 'single' },
  ]),
  t('support-mixed-14', 'サポート複合 14人', 'デスク+会議+休憩の複合構成', 'support', 'medium', 'standard', [
    { type: 'desk-area', name: 'サポートデスク', rows: 1, cols: 3, deskLayout: 'facing' },
    { type: 'meeting', name: '問題解決室', seats: 2 },
    { type: 'lounge', name: '休憩室' },
  ]),

  // ═══════════════════════════════════════════════════════════════
  // Hybrid (8)
  // ═══════════════════════════════════════════════════════════════
  t('hybrid-flex-8', 'フレックス 8人', '在宅+出社のフレックス', 'hybrid', 'small', 'standard', [
    { type: 'desk-area', name: 'フレックスデスク', rows: 1, cols: 2, deskLayout: 'facing' },
    { type: 'meeting', name: 'オンライン会議室', seats: 2 },
  ]),
  t('hybrid-flex-16', 'フレックス 16人', 'リモートフレンドリーオフィス', 'hybrid', 'medium', 'standard', [
    { type: 'desk-area', name: '出社デスク', rows: 1, cols: 3, deskLayout: 'facing' },
    { type: 'meeting', name: 'ビデオ会議室A', seats: 2 },
    { type: 'meeting', name: 'ビデオ会議室B', seats: 2 },
  ]),
  t('hybrid-meeting-heavy', '会議室多めハイブリッド', '会議中心のリモートワーク拠点', 'hybrid', 'medium', 'standard', [
    { type: 'desk-area', name: 'ホットデスク', rows: 1, cols: 2, deskLayout: 'facing' },
    { type: 'meeting', name: '会議室A', seats: 3 },
    { type: 'meeting', name: '会議室B', seats: 2 },
    { type: 'meeting', name: 'フォンブース', seats: 1 },
  ]),
  t('hybrid-remote-first', 'リモートファースト', '最小限デスク+多数会議室', 'hybrid', 'medium', 'standard', [
    { type: 'desk-area', name: 'タッチダウンデスク', rows: 1, cols: 2, deskLayout: 'single' },
    { type: 'meeting', name: 'Zoom部屋A', seats: 2 },
    { type: 'meeting', name: 'Zoom部屋B', seats: 1 },
    { type: 'lounge', name: 'コラボラウンジ' },
  ]),
  t('hybrid-satellite-6', 'サテライトオフィス 6人', '地方拠点のサテライト', 'hybrid', 'small', 'standard', [
    { type: 'desk-area', name: 'サテライトデスク', rows: 1, cols: 1, deskLayout: 'facing' },
    { type: 'meeting', name: 'テレビ会議室', seats: 2 },
  ]),
  t('hybrid-hub-20', 'ハイブリッドハブ 20人', '出社日のハブオフィス', 'hybrid', 'large', 'standard', [
    { type: 'desk-area', name: 'フリーデスク', rows: 2, cols: 3, deskLayout: 'facing' },
    { type: 'meeting', name: 'オンラインMTG室', seats: 3 },
    { type: 'cafe', name: 'カフェスペース', rows: 1, cols: 2 },
  ]),
  t('hybrid-colab-10', 'コラボレーションハブ', '対面コラボ重視のハイブリッド', 'hybrid', 'medium', 'standard', [
    { type: 'desk-area', name: 'コラボデスク', rows: 1, cols: 2, deskLayout: 'facing' },
    { type: 'lounge', name: 'ブレストラウンジ' },
    { type: 'meeting', name: 'ペアリングルーム', seats: 1 },
  ]),
  t('hybrid-global-12', 'グローバルハブ 12人', '海外チームとの連携拠点', 'hybrid', 'medium', 'standard', [
    { type: 'desk-area', name: 'ワークデスク', rows: 1, cols: 2, deskLayout: 'facing' },
    { type: 'meeting', name: 'グローバルMTG', seats: 3 },
    { type: 'lounge', name: 'インフォーマルゾーン' },
  ]),
];
