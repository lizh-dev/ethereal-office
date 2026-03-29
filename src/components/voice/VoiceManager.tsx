'use client';

import { useWebRTC } from '@/hooks/useWebRTC';
import VoiceControls from './VoiceControls';

/**
 * VoiceManager must be rendered inside a WebSocketProvider.
 * It initializes the WebRTC hook and renders the voice controls UI.
 */
export default function VoiceManager() {
  const webrtc = useWebRTC();
  return <VoiceControls webrtc={webrtc} />;
}
