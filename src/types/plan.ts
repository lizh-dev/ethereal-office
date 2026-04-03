export type PlanType = 'free' | 'pro';

export interface PlanPermissions {
  voiceCall: boolean;
  videoCall: boolean;
  screenShare: boolean;
  fileShare: boolean;
  meetingBoard: boolean;
  floorTemplates: boolean;
  adminFeatures: boolean;
  prioritySupport: boolean;
  maxMembers: number;
  customBranding: boolean;
  sso: boolean;
  dedicatedEnv: boolean;
  sla: boolean;
  apiAccess: boolean;
}

export const DEFAULT_PERMISSIONS: PlanPermissions = {
  voiceCall: false,
  videoCall: false,
  screenShare: false,
  fileShare: false,
  meetingBoard: false,
  floorTemplates: false,
  adminFeatures: false,
  prioritySupport: false,
  maxMembers: 10,
  customBranding: false,
  sso: false,
  dedicatedEnv: false,
  sla: false,
  apiAccess: false,
};

export type FeatureKey = keyof Omit<PlanPermissions, 'maxMembers'>;

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  voiceCall: '音声通話',
  videoCall: 'ビデオ通話',
  screenShare: '画面共有',
  fileShare: 'ファイル共有',
  meetingBoard: '共有ホワイトボード',
  floorTemplates: 'フロアテンプレート',
  adminFeatures: 'メンバー管理',
  prioritySupport: '優先サポート',
  customBranding: 'カスタムブランディング',
  sso: 'シングルサインオン',
  dedicatedEnv: '専用環境',
  sla: 'SLA保証',
  apiAccess: 'APIアクセス',
};
