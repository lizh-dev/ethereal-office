'use client';

import { useCallback } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import type { Seat, Zone } from '@/types';

const ZONE_TYPE_COLORS: Record<Zone['type'], string> = {
  desk: '#4F46E5',
  meeting: '#059669',
  lounge: '#D97706',
  cafe: '#BE185D',
  open: '#6B7280',
};

function SeatIndicator({
  seat,
  zoneType,
  onSit,
}: {
  seat: Seat;
  zoneType: Zone['type'];
  onSit: (seatId: string) => void;
}) {
  const color = ZONE_TYPE_COLORS[zoneType];

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!seat.occupied) {
        onSit(seat.id);
      }
    },
    [seat.id, seat.occupied, onSit],
  );

  if (seat.occupied) {
    // Occupied seats are invisible here; the avatar renders at seat position
    return null;
  }

  return (
    <div
      onClick={handleClick}
      style={{
        position: 'absolute',
        left: seat.x,
        top: seat.y,
        transform: 'translate(-50%, -50%)',
        zIndex: 10,
        pointerEvents: 'auto',
        cursor: 'pointer',
      }}
    >
      {/* Pulsing ring */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: `2px solid ${color}`,
          opacity: 0.3,
          animation: 'seatPulse 2.5s ease-in-out infinite',
        }}
      />
      {/* Inner circle with + */}
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          backgroundColor: `${color}18`,
          border: `1.5px dashed ${color}60`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.2s, border-color 0.2s, transform 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = `${color}30`;
          e.currentTarget.style.borderColor = color;
          e.currentTarget.style.transform = 'scale(1.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = `${color}18`;
          e.currentTarget.style.borderColor = `${color}60`;
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: `${color}99`,
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          +
        </span>
      </div>
    </div>
  );
}

export default function SeatLayer() {
  const zones = useOfficeStore((s) => s.zones);
  const sitAt = useOfficeStore((s) => s.sitAt);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
      }}
    >
      {/* Pulse animation for seats */}
      <style>{`
        @keyframes seatPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.2; }
          50% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.4; }
        }
      `}</style>

      {zones.map((zone) =>
        zone.seats.map((seat) => (
          <SeatIndicator
            key={seat.id}
            seat={seat}
            zoneType={zone.type}
            onSit={sitAt}
          />
        )),
      )}
    </div>
  );
}
