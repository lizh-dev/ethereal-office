'use client';

import { useOfficeStore } from '@/store/officeStore';
import IncomingCallDialog from './IncomingCallDialog';

/**
 * VoiceManager — renders incoming call dialog and handles call acceptance.
 * Uses deterministic room naming so both caller and callee join the same room.
 */
export default function VoiceManager() {
  const handleAcceptCall = (fromUserId: string) => {
    const slug = window.location.pathname.split('/')[2] || '';
    const myUserId = useOfficeStore.getState().currentUser.id;
    const myName = useOfficeStore.getState().currentUser.name;
    // Deterministic room name: sorted user IDs
    const ids = [fromUserId, myUserId].sort();
    const roomId = `${slug}-call-${ids[0].slice(0, 8)}-${ids[1].slice(0, 8)}`;
    window.open(`/meeting/${roomId}?name=${encodeURIComponent(myName)}`, '_blank');
  };

  return <IncomingCallDialog onAccept={handleAcceptCall} />;
}
