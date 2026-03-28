'use client';

import { useMemo, useState } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import { getAvatarUrl } from '@/components/floor/assets';
import ChatBubble from './ChatBubble';
import type { User, PresenceStatus, UserAction } from '@/types';

const PROXIMITY_RADIUS = 120;
const VOICE_RANGE_DISPLAY = 100;

const STATUS_COLORS: Record<PresenceStatus, string> = {
  online: '#22c55e',
  busy: '#ef4444',
  focusing: '#eab308',
  offline: '#9ca3af',
};

const STATUS_LABELS: Record<PresenceStatus, string> = {
  online: 'オンライン',
  busy: '取り込み中',
  focusing: '集中モード',
  offline: 'オフライン',
};

const ACTION_EMOJI: Record<UserAction, string> = {
  working: '\uD83D\uDCBB',
  meeting: '\uD83E\uDD1D',
  break: '\u2615',
  away: '\uD83D\uDCA4',
  idle: '',
};

const ACTION_LABELS: Record<UserAction, string> = {
  working: '作業中',
  meeting: 'ミーティング',
  break: '休憩中',
  away: '離席中',
  idle: '',
};

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

interface AvatarProps {
  user: User;
  isCurrent: boolean;
  nearbyUsers: User[];
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  action?: UserAction;
  isSeated?: boolean;
}

function Avatar({ user, isCurrent, nearbyUsers, hoveredId, onHover, action, isSeated }: AvatarProps) {
  const pos = user.position;
  const avatarUrl = getAvatarUrl(user.avatarSeed ?? user.name, user.avatarStyle ?? 'notionists');
  const statusColor = STATUS_COLORS[user.status] ?? STATUS_COLORS.offline;
  const isHovered = hoveredId === user.id;
  const isNearCurrent = nearbyUsers.some((u) => u.id === user.id);
  const chatMessages = useOfficeStore((s) => s.chatMessages);

  // Find active chat message for this user
  const activeMessage = chatMessages.find(
    (m) => m.userId === user.id && Date.now() - m.timestamp < 5000,
  );

  const currentAction = action || 'idle';
  const actionEmoji = ACTION_EMOJI[currentAction];

  return (
    <div
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        transform: 'translate(-50%, -50%)',
        zIndex: isHovered ? 30 : 20,
        pointerEvents: 'auto',
        transition: isSeated ? 'left 0.4s ease, top 0.4s ease' : undefined,
      }}
    >
      {/* Proximity / voice range circle */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: VOICE_RANGE_DISPLAY * 2,
          height: VOICE_RANGE_DISPLAY * 2,
          borderRadius: '50%',
          background: isCurrent
            ? 'radial-gradient(circle, rgba(79,70,229,0.08) 0%, rgba(79,70,229,0.02) 60%, transparent 100%)'
            : 'radial-gradient(circle, rgba(100,100,100,0.05) 0%, transparent 70%)',
          border: isCurrent
            ? '1px solid rgba(79,70,229,0.15)'
            : isNearCurrent
              ? '1px solid rgba(79,70,229,0.1)'
              : '1px solid rgba(200,200,200,0.1)',
          pointerEvents: 'none',
          transition: 'border-color 0.4s ease, background 0.4s ease',
          animation: isCurrent ? 'pulse-ring 3s ease-in-out infinite' : undefined,
        }}
      />

      {/* Chat bubble */}
      {activeMessage && (
        <ChatBubble text={activeMessage.text} />
      )}

      {/* Avatar container */}
      <div
        onMouseEnter={() => onHover(user.id)}
        onMouseLeave={() => onHover(null)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'pointer',
          transition: 'transform 0.2s ease',
          transform: isHovered ? 'scale(1.15)' : 'scale(1)',
        }}
      >
        {/* Avatar image circle */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: isCurrent ? '3px solid #4F46E5' : '2px solid #fff',
            boxShadow: isHovered
              ? '0 4px 16px rgba(0,0,0,0.25)'
              : isCurrent
                ? '0 2px 12px rgba(79,70,229,0.3)'
                : '0 2px 8px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            backgroundColor: user.avatarColor,
            position: 'relative',
            transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarUrl}
            alt={user.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            draggable={false}
          />
          {/* Status dot */}
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
              transition: 'background-color 0.3s',
            }}
          />
        </div>

        {/* Action badge */}
        {actionEmoji && (
          <div
            style={{
              position: 'absolute',
              top: -6,
              right: -10,
              width: 20,
              height: 20,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
              zIndex: 5,
              animation: 'badgePop 0.3s ease-out',
            }}
          >
            {actionEmoji}
          </div>
        )}

        {/* Name label */}
        <div
          style={{
            marginTop: 4,
            fontSize: 10,
            fontWeight: 600,
            color: '#374151',
            backgroundColor: 'rgba(255,255,255,0.9)',
            padding: '1px 8px',
            borderRadius: 6,
            whiteSpace: 'nowrap',
            maxWidth: 90,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textAlign: 'center',
            lineHeight: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            transition: 'background-color 0.2s',
          }}
        >
          {isCurrent ? `${user.name} (You)` : user.name}
        </div>
      </div>

      {/* Hover tooltip */}
      {isHovered && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 8,
            backgroundColor: 'rgba(17,24,39,0.92)',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: 12,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 100,
            pointerEvents: 'none',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 2 }}>{user.name}</div>
          {user.role && (
            <div style={{ fontSize: 11, color: '#d1d5db', marginBottom: 2 }}>{user.role}</div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: statusColor,
              }}
            />
            <span style={{ color: '#e5e7eb' }}>{STATUS_LABELS[user.status]}</span>
          </div>
          {currentAction !== 'idle' && (
            <div style={{ fontSize: 11, color: '#a5b4fc', marginTop: 2 }}>
              {actionEmoji} {ACTION_LABELS[currentAction]}
            </div>
          )}
          {/* Tooltip arrow */}
          <div
            style={{
              position: 'absolute',
              bottom: -4,
              left: '50%',
              transform: 'translateX(-50%) rotate(45deg)',
              width: 8,
              height: 8,
              backgroundColor: 'rgba(17,24,39,0.92)',
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function AvatarLayer() {
  const users = useOfficeStore((s) => s.users);
  const currentUser = useOfficeStore((s) => s.currentUser);
  const currentAction = useOfficeStore((s) => s.currentAction);
  const currentSeatId = useOfficeStore((s) => s.currentSeatId);
  const zones = useOfficeStore((s) => s.zones);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const allUsers = useMemo(() => [currentUser, ...users], [currentUser, users]);

  // Build a map of userId -> action based on seat occupancy
  const userActions = useMemo(() => {
    const map: Record<string, UserAction> = {};
    for (const zone of zones) {
      for (const seat of zone.seats) {
        if (seat.occupied && seat.occupiedBy) {
          const actionMap: Record<string, UserAction> = {
            desk: 'working',
            meeting: 'meeting',
            lounge: 'break',
            cafe: 'break',
            open: 'idle',
          };
          map[seat.occupiedBy] = actionMap[zone.type] || 'idle';
        }
      }
    }
    return map;
  }, [zones]);

  // Build a set of seated user IDs
  const seatedUserIds = useMemo(() => {
    const set = new Set<string>();
    for (const zone of zones) {
      for (const seat of zone.seats) {
        if (seat.occupied && seat.occupiedBy) {
          set.add(seat.occupiedBy);
        }
      }
    }
    return set;
  }, [zones]);

  // Compute proximity connections (pairs of users within PROXIMITY_RADIUS)
  const connections = useMemo(() => {
    const pairs: { from: User; to: User; dist: number }[] = [];
    for (let i = 0; i < allUsers.length; i++) {
      for (let j = i + 1; j < allUsers.length; j++) {
        const d = distance(allUsers[i].position, allUsers[j].position);
        if (d < PROXIMITY_RADIUS) {
          pairs.push({ from: allUsers[i], to: allUsers[j], dist: d });
        }
      }
    }
    return pairs;
  }, [allUsers]);

  // Users near the current user
  const nearbyUsers = useMemo(
    () =>
      users.filter((u) => distance(u.position, currentUser.position) < PROXIMITY_RADIUS),
    [users, currentUser.position],
  );

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
      }}
    >
      {/* Global CSS animations */}
      <style>{`
        @keyframes pulse-ring {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(4px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes bubbleIn {
          from { opacity: 0; transform: translateX(-50%) scale(0.8) translateY(4px); }
          to { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
        }
        @keyframes connectionPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
        @keyframes badgePop {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
      `}</style>

      {/* Connection lines between nearby users (SVG overlay) */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      >
        <defs>
          <linearGradient id="connection-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        {connections.map(({ from, to, dist }, i) => {
          const opacity = Math.max(0.15, 1 - dist / PROXIMITY_RADIUS);
          return (
            <line
              key={`${from.id}-${to.id}-${i}`}
              x1={from.position.x}
              y1={from.position.y}
              x2={to.position.x}
              y2={to.position.y}
              stroke="url(#connection-gradient)"
              strokeWidth={2.5}
              strokeDasharray="6 4"
              opacity={opacity}
              style={{ animation: 'connectionPulse 2s ease-in-out infinite' }}
            />
          );
        })}
      </svg>

      {/* Other users */}
      {users.map((user) => (
        <Avatar
          key={user.id}
          user={user}
          isCurrent={false}
          nearbyUsers={nearbyUsers}
          hoveredId={hoveredId}
          onHover={setHoveredId}
          action={userActions[user.id]}
          isSeated={seatedUserIds.has(user.id)}
        />
      ))}

      {/* Current user (rendered last = on top) */}
      <Avatar
        user={currentUser}
        isCurrent={true}
        nearbyUsers={nearbyUsers}
        hoveredId={hoveredId}
        onHover={setHoveredId}
        action={currentSeatId ? currentAction : 'idle'}
        isSeated={!!currentSeatId}
      />
    </div>
  );
}
