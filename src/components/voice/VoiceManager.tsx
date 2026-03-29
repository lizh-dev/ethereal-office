'use client';

import { useEffect, useRef } from 'react';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useOfficeStore } from '@/store/officeStore';
import VoiceControls from './VoiceControls';
import IncomingCallDialog from './IncomingCallDialog';

/**
 * VoiceManager must be rendered inside a WebSocketProvider.
 * It initializes the WebRTC hook and renders the voice controls UI.
 * Also handles the call request accept/decline flow.
 */
export default function VoiceManager() {
  const webrtc = useWebRTC();
  const callRequestStatus = useOfficeStore((s) => s.callRequestStatus);
  const callTargetUserId = useOfficeStore((s) => s.callTargetUserId);
  const prevStatusRef = useRef(callRequestStatus);

  // When call is accepted by the other side, start WebRTC connection
  useEffect(() => {
    if (callRequestStatus === 'accepted' && callTargetUserId && prevStatusRef.current !== 'accepted') {
      webrtc.joinVoiceWith(callTargetUserId);
      // Clear the call request state after starting the connection
      setTimeout(() => {
        useOfficeStore.getState().clearCallRequest();
      }, 500);
    }
    prevStatusRef.current = callRequestStatus;
  }, [callRequestStatus, callTargetUserId, webrtc]);

  // Handle incoming call accept (receiver side)
  const handleAcceptCall = (fromUserId: string) => {
    webrtc.joinVoiceWith(fromUserId);
  };

  return (
    <>
      <VoiceControls webrtc={webrtc} />
      <IncomingCallDialog onAccept={handleAcceptCall} />
    </>
  );
}
