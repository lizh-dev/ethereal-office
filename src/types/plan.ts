export type PlanType = 'free' | 'pro';

export interface PlanPermissions {
  voiceCall: boolean;
  videoCall: boolean;
  screenShare: boolean;
  fileShare: boolean;
  meetingBoard: boolean;
  meetingInlineBoard: boolean;
  floorTemplates: boolean;
  adminFeatures: boolean;
  prioritySupport: boolean;
  maxMembers: number;
  maxMeetingParticipants: number; // 0 = unlimited
  maxConcurrentMeetings: number;  // 0 = unlimited
  customBranding: boolean;
  sso: boolean;
  dedicatedEnv: boolean;
  sla: boolean;
  apiAccess: boolean;
}

export const DEFAULT_PERMISSIONS: PlanPermissions = {
  voiceCall: true,
  videoCall: true,
  screenShare: true,
  fileShare: false,
  meetingBoard: true,
  meetingInlineBoard: false,
  floorTemplates: false,
  adminFeatures: true,
  prioritySupport: false,
  maxMembers: 10,
  maxMeetingParticipants: 4,
  maxConcurrentMeetings: 1,
  customBranding: false,
  sso: false,
  dedicatedEnv: false,
  sla: false,
  apiAccess: false,
};

export type FeatureKey = keyof Omit<PlanPermissions, 'maxMembers' | 'maxMeetingParticipants' | 'maxConcurrentMeetings' | 'maxBoards'>;

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  voiceCall: '音声通話',
  videoCall: 'ビデオ通話',
  screenShare: '画面共有',
  fileShare: 'ファイル共有',
  meetingBoard: '共有ホワイトボード',
  meetingInlineBoard: 'ミーティング内ボード',
  floorTemplates: 'フロアテンプレート',
  adminFeatures: 'メンバー管理',
  prioritySupport: '優先サポート',
  customBranding: 'カスタムブランディング',
  sso: 'シングルサインオン',
  dedicatedEnv: '専用環境',
  sla: 'SLA保証',
  apiAccess: 'APIアクセス',
};
