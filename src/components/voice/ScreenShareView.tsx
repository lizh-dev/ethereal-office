'use client';

import { useEffect, useRef, useState } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import { useWsSend } from '@/contexts/WebSocketContext';

export default function ScreenShareView() {
  const screenShareUserId = useOfficeStore((s) => s.screenShareUserId);
  const screenShareUserName = useOfficeStore((s) => s.screenShareUserName);
  const currentUser = useOfficeStore((s) => s.currentUser);
  const wsSend = useWsSend();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [localScreenStream, setLocalScreenStream] = useState<MediaStream | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  const isSharing = screenShareUserId === currentUser.id;

  // Start screen sharing
  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      setLocalScreenStream(stream);
      wsSend.screenShareStart();

      // Handle user stopping share via browser UI
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch {
      // User cancelled or error
    }
  };

  // Stop screen sharing
  const stopScreenShare = () => {
    if (localScreenStream) {
      localScreenStream.getTracks().forEach((t) => t.stop());
      setLocalScreenStream(null);
    }
    wsSend.screenShareStop();
    useOfficeStore.setState({ screenShareUserId: null, screenShareUserName: null });
  };

  // Show local screen preview
  useEffect(() => {
    if (videoRef.current && localScreenStream) {
      videoRef.current.srcObject = localScreenStream;
    }
  }, [localScreenStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localScreenStream) {
        localScreenStream.getTracks().forEach((t) => t.stop());
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // No screen share active - show start button
  if (!screenShareUserId && !localScreenStream) {
    return (
      <button
        onClick={startScreenShare}
        className="fixed bottom-16 md:bottom-4 right-16 md:right-4 z-40 flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg shadow-lg transition-colors"
        title="画面共有を開始"
      >
        🖥️ 画面共有
      </button>
    );
  }

  // Minimized state
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-16 md:bottom-4 right-16 md:right-4 z-40 flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg shadow-lg"
      >
        🖥️ {isSharing ? '共有中' : `${screenShareUserName}の画面`}
        <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
      </button>
    );
  }

  // Screen share panel (self sharing preview or viewing someone else's share)
  return (
    <div className="fixed bottom-16 md:bottom-4 right-4 z-40 w-[90vw] md:w-[480px] bg-gray-900 rounded-xl shadow-2xl overflow-hidden border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          <span className="text-xs text-gray-300 font-medium">
            {isSharing ? '画面共有中' : `${screenShareUserName} の画面共有`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-gray-700 text-xs"
          >
            ─
          </button>
          {isSharing && (
            <button
              onClick={stopScreenShare}
              className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-medium rounded transition-colors"
            >
              停止
            </button>
          )}
        </div>
      </div>
      {/* Video preview */}
      {localScreenStream ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          className="w-full aspect-video bg-black"
        />
      ) : (
        <div className="w-full aspect-video bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col items-center justify-center text-center px-4">
          <div className="text-3xl mb-3">🖥️</div>
          <div className="text-white text-sm font-medium">{screenShareUserName} が画面を共有中</div>
          <div className="text-gray-400 text-xs mt-2">同じゾーンで通話に参加すると画面が表示されます</div>
        </div>
      )}
    </div>
  );
}
