'use client';

import { useJitsiVoice } from '@/hooks/useJitsiVoice';
import { useOfficeStore } from '@/store/officeStore';
import JitsiVoicePanel from './JitsiVoicePanel';
import JitsiCallBar from './JitsiCallBar';
import IncomingCallDialog from './IncomingCallDialog';

/**
 * VoiceManager must be rendered inside a WebSocketProvider.
 * It initializes the Jitsi voice hook and renders voice UI components.
 * Zone auto-join, 1:1 call handling, and UI rendering are all managed via useJitsiVoice.
 */
export default function VoiceManager() {
  const jitsi = useJitsiVoice();

  const handleAcceptCall = (fromUserId: string) => {
    const caller = useOfficeStore.getState().users.find(u => u.id === fromUserId);
    jitsi.joinCallRoom(fromUserId, caller?.name || 'ゲスト');
  };

  return (
    <>
      <JitsiVoicePanel jitsi={jitsi} />
      <JitsiCallBar jitsi={jitsi} />
      <IncomingCallDialog onAccept={handleAcceptCall} />
    </>
  );
}
