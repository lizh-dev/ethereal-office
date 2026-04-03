'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Receipt,
  LogOut,
  ChevronDown,
} from 'lucide-react';

const menuGroups = [
  {
    id: 'management',
    label: '管理',
    items: [
      { href: '/admin', icon: LayoutDashboard, label: 'ダッシュボード' },
      { href: '/admin/floors', icon: Building2, label: 'フロア管理' },
    ],
  },
  {
    id: 'finance',
    label: '売上・決済',
    items: [
      { href: '/admin/subscriptions', icon: CreditCard, label: 'サブスクリプション' },
      { href: '/admin/transactions', icon: Receipt, label: '取引履歴' },
    ],
  },
];

function AdminSidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const def: Record<string, boolean> = {};
    menuGroups.forEach(g => { def[g.id] = true; });
    return def;
  });

  const isActive = useCallback((href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname === href || pathname.startsWith(`${href}/`);
  }, [pathname]);

  return (
    <aside style={{
      width: 240, minHeight: '100vh', background: '#ffffff', color: '#334155',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      borderRight: '1px solid #e2e8f0',
    }}>
      <div style={{
        padding: '20px 16px', borderBottom: '1px solid #e2e8f0',
        fontWeight: 700, fontSize: 14, letterSpacing: 1,
      }}>
        <span style={{ color: '#0ea5e9' }}>SmartOffice</span> <span style={{ color: '#475569' }}>Admin</span>
      </div>

      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
        {menuGroups.map(group => (
          <div key={group.id}>
            <button
              onClick={() => setExpanded(prev => ({ ...prev, [group.id]: !prev[group.id] }))}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 16px', background: 'none', border: 'none', color: '#64748b',
                fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer',
              }}
            >
              {group.label}
              <ChevronDown size={14} style={{
                transform: expanded[group.id] ? 'rotate(0)' : 'rotate(-90deg)',
                transition: 'transform 0.2s',
              }} />
            </button>
            {expanded[group.id] && group.items.map(item => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                  color: active ? '#0ea5e9' : '#64748b', textDecoration: 'none', fontSize: 13,
                  background: active ? '#f0f9ff' : 'transparent', borderRight: active ? '2px solid #0ea5e9' : 'none',
                  transition: 'all 0.15s',
                }}>
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <button
        onClick={() => {
          sessionStorage.removeItem('admin-secret');
          window.location.href = '/admin';
        }}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px',
          background: 'none', border: 'none', borderTop: '1px solid #e2e8f0',
          color: '#64748b', cursor: 'pointer', fontSize: 13, width: '100%',
        }}
      >
        <LogOut size={16} />
        ログアウト
      </button>
    </aside>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem('admin-secret');
    if (stored) {
      fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: stored }),
      }).then(r => {
        if (r.ok) setAuthed(true);
        else sessionStorage.removeItem('admin-secret');
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret }),
    });
    if (res.ok) {
      sessionStorage.setItem('admin-secret', secret);
      setAuthed(true);
    } else {
      setError('管理者シークレットが正しくありません');
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#f8fafc',
      }}>
        <div style={{
          width: 32, height: 32, border: '3px solid #e2e8f0',
          borderTop: '3px solid #38bdf8', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!authed) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#f8fafc',
      }}>
        <form onSubmit={handleLogin} style={{
          background: 'white', padding: 40, borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          width: 380, textAlign: 'center',
        }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: '#0f172a' }}>
            SmartOffice Admin
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>
            管理者シークレットを入力してください
          </p>
          <input
            type="password"
            value={secret}
            onChange={e => setSecret(e.target.value)}
            placeholder="Admin Secret"
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 8,
              border: '1px solid #e2e8f0', fontSize: 14, marginBottom: 12,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
          {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button type="submit" style={{
            width: '100%', padding: '10px 0', borderRadius: 8, border: 'none',
            background: '#0ea5e9', color: 'white', fontSize: 14, fontWeight: 600,
            cursor: 'pointer',
          }}>
            ログイン
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <AdminSidebar />
      <main style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
