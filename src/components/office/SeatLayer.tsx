'use client';

import { useCallback } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import type { Seat, Zone } from '@/types';

function SeatSpot({ seat, onSit }: { seat: Seat; onSit: (id: string) => void }) {
  if (seat.occupied) return null;

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onSit(seat.id); }}
      title="ここに座る"
      style={{
        position: 'absolute',
        left: seat.x,
        top: seat.y,
        transform: 'translate(-50%, -50%)',
        width: 24,
        height: 24,
        borderRadius: '50%',
        cursor: 'pointer',
        pointerEvents: 'auto',
        zIndex: 10,
        opacity: 0,
        transition: 'opacity 0.2s, background-color 0.2s',
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        border: '1.5px solid rgba(99, 102, 241, 0.3)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = '0'; }}
    />
  );
}

export default function SeatLayer() {
  const zones = useOfficeStore((s) => s.zones);
  const sitAt = useOfficeStore((s) => s.sitAt);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {zones.map((zone) =>
        zone.seats.map((seat) => (
          <SeatSpot key={seat.id} seat={seat} onSit={sitAt} />
        )),
      )}
    </div>
  );
}
