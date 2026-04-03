'use client';

import { useOfficeStore } from '@/store/officeStore';
import type { FeatureKey } from '@/types/plan';
import { FEATURE_LABELS } from '@/types/plan';

interface FeatureGateProps {
  feature: FeatureKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function DefaultUpgradePrompt({ feature }: { feature: FeatureKey }) {
  const slug = typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : '';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24, textAlign: 'center', gap: 12,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: 'linear-gradient(135deg, #e0f2fe, #ede9fe)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
      }}>
        &#x1F512;
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
        {FEATURE_LABELS[feature]}はProプラン以上で利用できます
      </div>
      <a
        href={`/f/${slug}/upgrade`}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
          background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
          color: 'white', textDecoration: 'none',
        }}
      >
        Proにアップグレード
      </a>
    </div>
  );
}

export default function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const canUse = useOfficeStore(s => s.canUseFeature)(feature);

  if (canUse) return <>{children}</>;

  return <>{fallback ?? <DefaultUpgradePrompt feature={feature} />}</>;
}
