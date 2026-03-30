'use client';

import { useEffect, useRef } from 'react';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useProximityVoice } from '@/hooks/useProximityVoice';
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
  const currentSeatId = useOfficeStore((s) => s.currentSeatId);
  const autoVoiceEnabled = useOfficeStore((s) => s.autoVoiceEnabled);
  const prevStatusRef = useRef(callRequestStatus);
  const prevSeatRef = useRef<string | null>(null);
  const webrtcRef = useRef(webrtc);
  webrtcRef.current = webrtc;

  // Auto Zone Voice: automatically join/leave voice when sitting/standing
  useEffect(() => {
    if (!autoVoiceEnabled) {
      prevSeatRef.current = currentSeatId;
      return;
    }

    const wasSitting = prevSeatRef.current !== null;
    const isSitting = currentSeatId !== null;

    if (!wasSitting && isSitting) {
      // Just sat down → try joining zone voice with retries (wait for seat sync to propagate)
      let attempts = 0;
      let cancelled = false;
      const tryJoin = () => {
        if (cancelled) return;
        attempts++;
        // Directly compute canJoinVoice from latest store state (not stale hook value)
        const store = useOfficeStore.getState();
        const seatId = store.currentSeatId;
        const userId = store.currentUser.id;
        if (!seatId || userId === 'pending') return;
        // Find zone peers
        let hasPeers = false;
        for (const zone of store.zones) {
          if (zone.seats.some(s => s.id === seatId)) {
            hasPeers = zone.seats.some(s => s.occupied && s.occupiedBy && s.occupiedBy !== userId);
            break;
          }
        }
        if (hasPeers && !webrtcRef.current.isVoiceActive) {
          console.log('[AutoVoice] Joining zone voice, attempt', attempts);
          webrtcRef.current.joinVoice();
        } else if (attempts < 10) {
          setTimeout(tryJoin, 500);
        }
      };
      const timer = setTimeout(tryJoin, 1000);
      prevSeatRef.current = currentSeatId;
      return () => { cancelled = true; clearTimeout(timer); };
    } else if (wasSitting && !isSitting) {
      // Just stood up → leave voice
      if (webrtcRef.current.isVoiceActive) {
        webrtcRef.current.leaveVoice();
      }
    }

    prevSeatRef.current = currentSeatId;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSeatId, autoVoiceEnabled]);

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

  // Proximity voice: auto-connect based on distance when walking around
  useProximityVoice(webrtc);

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
