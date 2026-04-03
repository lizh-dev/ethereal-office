'use client';

import IncomingCallDialog from './IncomingCallDialog';

/**
 * VoiceManager — minimal. Just renders the incoming call dialog.
 * Jitsi meetings are opened in separate tabs now.
 */
export default function VoiceManager() {
  const handleAcceptCall = (_fromUserId: string) => {
    // 1:1 calls now redirect to Jitsi in a new tab
    const slug = window.location.pathname.split('/')[2] || '';
    const jitsiUrl = `/meeting/${slug}-call-${Date.now()}`;
    window.open(jitsiUrl, '_blank');
  };

  return <IncomingCallDialog onAccept={handleAcceptCall} />;
}
