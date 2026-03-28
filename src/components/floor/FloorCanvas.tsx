'use client';

import dynamic from 'next/dynamic';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import { getAvatarUrl } from './assets';
import type { User, PresenceStatus } from '@/types';

const Editor = dynamic(() => import('./ExcalidrawEditor'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
      読み込み中...
    </div>
  ),
});

const STATUS_COLORS: Record<PresenceStatus, string> = {
  online: '#22c55e',
  busy: '#ef4444',
  focusing: '#eab308',
  offline: '#9ca3af',
};

function AvatarMarker({ user, isCurrent }: { user: User; isCurrent: boolean }) {
  const pos = user.targetPosition ?? user.position;
  const avatarUrl = getAvatarUrl(user.avatarSeed ?? user.name, user.avatarStyle ?? 'notionists');
  const statusColor = STATUS_COLORS[user.status] ?? STATUS_COLORS.offline;

  return (
    <div
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: 'none',
        transition: 'left 0.4s ease, top 0.4s ease',
        zIndex: 10,
      }}
    >
      {/* Avatar circle */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: isCurrent ? '3px solid #4F46E5' : '2px solid #fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
          overflow: 'hidden',
          backgroundColor: user.avatarColor,
          position: 'relative',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt={user.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {/* Status indicator dot */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: statusColor,
            border: '2px solid #fff',
          }}
        />
      </div>
      {/* User name label */}
      <div
        style={{
          marginTop: 3,
          fontSize: 10,
          fontWeight: 600,
          color: '#374151',
          backgroundColor: 'rgba(255,255,255,0.85)',
          padding: '1px 6px',
          borderRadius: 4,
          whiteSpace: 'nowrap',
          maxWidth: 80,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textAlign: 'center',
          lineHeight: '14px',
        }}
      >
        {user.name}
      </div>
    </div>
  );
}

export default function FloorCanvas() {
  const ref = useRef<HTMLDivElement>(null);
  const [h, setH] = useState(600);

  const editorMode = useOfficeStore((s) => s.editorMode);
  const users = useOfficeStore((s) => s.users);
  const currentUser = useOfficeStore((s) => s.currentUser);
  const moveCurrentUser = useOfficeStore((s) => s.moveCurrentUser);

  const isViewMode = editorMode !== 'edit';

  useEffect(() => {
    const update = () => { if (ref.current) setH(ref.current.clientHeight); };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isViewMode) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      moveCurrentUser(x, y);
    },
    [isViewMode, moveCurrentUser],
  );

  return (
    <div ref={ref} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div style={{ width: '100%', height: `${h}px` }}>
        <Editor viewMode={isViewMode} />
      </div>

      {/* Avatar overlay — shown when NOT in edit mode */}
      {isViewMode && (
        <div
          onClick={handleOverlayClick}
          style={{
            position: 'absolute',
            inset: 0,
            cursor: 'pointer',
            zIndex: 5,
          }}
        >
          {/* Other users */}
          {users.map((user) => (
            <AvatarMarker key={user.id} user={user} isCurrent={false} />
          ))}
          {/* Current user */}
          <AvatarMarker user={currentUser} isCurrent={true} />
        </div>
      )}
    </div>
  );
}
