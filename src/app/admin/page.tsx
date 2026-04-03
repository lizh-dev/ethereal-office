'use client';

import { useEffect, useState } from 'react';
import {
  Building2,
  CreditCard,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';

interface DashboardStats {
  totalFloors: number;
  activeFloors: number;
  totalSubscriptions: number;
  revenue30d: number;
  revenuePrev30d: number;
  totalTransactions: number;
}

function formatRevenue(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return amount.toLocaleString();
}

function getAdminSecret(): string {
  return sessionStorage.getItem('admin-secret') || '';
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard', {
      headers: { 'X-Admin-Secret': getAdminSecret() },
    })
      .then(r => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>読み込み中...</div>;
  }

  const revChange = stats.revenuePrev30d > 0
    ? ((stats.revenue30d - stats.revenuePrev30d) / stats.revenuePrev30d) * 100
    : stats.revenue30d > 0 ? 100 : 0;

  const kpis = [
    { label: '30日売上', value: `¥${formatRevenue(stats.revenue30d)}`, icon: TrendingUp, change: revChange },
    { label: '総フロア数', value: stats.totalFloors.toLocaleString(), icon: Building2 },
    { label: 'アクティブフロア (24h)', value: stats.activeFloors.toLocaleString(), icon: Activity },
    { label: '有料サブスク', value: stats.totalSubscriptions.toLocaleString(), icon: CreditCard },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, color: '#0f172a' }}>
        管理者ダッシュボード
      </h1>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16, marginBottom: 32,
      }}>
        {kpis.map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} style={{
              background: 'white', borderRadius: 12, padding: 20,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{kpi.label}</span>
                <Icon size={16} style={{ color: '#94a3b8' }} />
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#0f172a' }}>{kpi.value}</div>
              {'change' in kpi && kpi.change !== undefined && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4, marginTop: 8,
                  fontSize: 12, fontWeight: 500,
                  color: kpi.change > 0.01 ? '#10b981' : kpi.change < -0.01 ? '#ef4444' : '#94a3b8',
                }}>
                  {Math.abs(kpi.change) < 0.01 ? (
                    <><Minus size={14} /><span>前月同等</span></>
                  ) : kpi.change > 0 ? (
                    <><ArrowUpRight size={14} /><span>{kpi.change.toFixed(1)}%</span></>
                  ) : (
                    <><ArrowDownRight size={14} /><span>{Math.abs(kpi.change).toFixed(1)}%</span></>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
