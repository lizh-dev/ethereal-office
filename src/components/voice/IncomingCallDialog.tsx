'use client';

import { useEffect, useRef } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import { useWsSend } from '@/contexts/WebSocketContext';

interface IncomingCallDialogProps {
  onAccept: (fromUserId: string) => void;
}

export default function IncomingCallDialog({ onAccept }: IncomingCallDialogProps) {
  const incomingCallRequest = useOfficeStore((s) => s.incomingCallRequest);
  const wsSend = useWsSend();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-decline after 30 seconds
  useEffect(() => {
    if (!incomingCallRequest) return;

    timerRef.current = setTimeout(() => {
      if (incomingCallRequest) {
        wsSend.callDecline(incomingCallRequest.fromUserId);
        useOfficeStore.getState().setIncomingCallRequest(null);
      }
    }, 30000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [incomingCallRequest, wsSend]);

  if (!incomingCallRequest) return null;

  const handleAccept = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    wsSend.callAccept(incomingCallRequest.fromUserId);
    onAccept(incomingCallRequest.fromUserId);
    useOfficeStore.getState().setIncomingCallRequest(null);
  };

  const handleDecline = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    wsSend.callDecline(incomingCallRequest.fromUserId);
    useOfficeStore.getState().setIncomingCallRequest(null);
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]"
      onClick={handleDecline}
    >
      <div
        className="bg-white rounded-2xl shadow-xl p-6 max-w-xs w-full mx-4 text-center animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-4xl mb-3">📞</div>
        <p className="text-sm font-semibold text-gray-800 mb-1">
          {incomingCallRequest.fromUserName}さんが通話を希望しています
        </p>
        <p className="text-xs text-gray-500 mb-5">
          30秒後に自動的に拒否されます
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleDecline}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl text-sm transition-colors"
          >
            拒否
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl text-sm transition-colors"
          >
            応答
          </button>
        </div>
      </div>
    </div>
  );
}
