'use client';

import { useRef, useEffect } from 'react';
import { useOfficeStore } from '@/store/officeStore';

const ACTIVITY_ICONS: Record<string, string> = {
  join: '\uD83D\uDFE2',   // green circle
  leave: '\uD83D\uDD34',   // red circle
  status: '\uD83D\uDCAC',  // speech balloon
  seat: '\uD83E\uDE91',    // chair
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

export default function ActivityFeed() {
  const activityFeed = useOfficeStore((s) => s.activityFeed);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activityFeed.length]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#FAFAFA', borderRadius: 0,
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid #E5E7EB',
        fontSize: 13, fontWeight: 700, color: '#374151',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ fontSize: 15 }}>&#x1F4CB;</span>
        アクティビティ
        <span style={{
          fontSize: 10, color: '#9CA3AF', fontWeight: 400, marginLeft: 'auto',
        }}>
          {activityFeed.length > 0 ? `${activityFeed.length}件` : ''}
        </span>
      </div>

      {/* Feed list */}
      <div ref={scrollRef} style={{
        flex: 1, overflowY: 'auto', padding: '8px 12px',
      }}>
        {activityFeed.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '32px 16px',
            color: '#9CA3AF', fontSize: 12,
          }}>
            まだアクティビティはありません
          </div>
        )}
        {activityFeed.map((item) => (
          <div key={item.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            padding: '6px 4px', borderBottom: '1px solid #F3F4F6',
            animation: 'fadeIn 0.3s ease-out',
          }}>
            <span style={{ fontSize: 12, lineHeight: '18px', flexShrink: 0 }}>
              {ACTIVITY_ICONS[item.type] || '\u2022'}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 11, color: '#374151', lineHeight: '16px',
                wordBreak: 'break-all',
              }}>
                {item.message}
              </div>
              <div style={{
                fontSize: 9, color: '#9CA3AF', marginTop: 1,
              }}>
                {formatTime(item.timestamp)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
