'use client';

import { useEffect, useRef, useState } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import { useWsSend } from '@/contexts/WebSocketContext';
import type { WebRTCState } from '@/hooks/useWebRTC';

interface ScreenShareViewProps {
  webrtc: WebRTCState;
}

export default function ScreenShareView({ webrtc }: ScreenShareViewProps) {
  const screenShareUserId = useOfficeStore((s) => s.screenShareUserId);
  const screenShareUserName = useOfficeStore((s) => s.screenShareUserName);
  const currentUser = useOfficeStore((s) => s.currentUser);
  const wsSend = useWsSend();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [localScreenStream, setLocalScreenStream] = useState<MediaStream | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  const isSharing = screenShareUserId === currentUser.id;
  const hasRemoteVideo = !!webrtc.remoteVideoStream;

  // Start screen sharing
  const handleStartShare = async () => {
    const stream = await webrtc.startScreenShare();
    if (stream) {
      setLocalScreenStream(stream);
      wsSend.screenShareStart();
      stream.getVideoTracks()[0].onended = () => {
        handleStopShare();
      };
    }
  };

  // Stop screen sharing
  const handleStopShare = () => {
    webrtc.stopScreenShare();
    if (localScreenStream) {
      localScreenStream.getTracks().forEach((t) => t.stop());
      setLocalScreenStream(null);
    }
    wsSend.screenShareStop();
    useOfficeStore.setState({ screenShareUserId: null, screenShareUserName: null });
  };

  // Attach local screen preview
  useEffect(() => {
    if (localVideoRef.current && localScreenStream) {
      localVideoRef.current.srcObject = localScreenStream;
    }
  }, [localScreenStream]);

  // Attach remote screen share video
  useEffect(() => {
    if (remoteVideoRef.current && webrtc.remoteVideoStream) {
      remoteVideoRef.current.srcObject = webrtc.remoteVideoStream;
    }
  }, [webrtc.remoteVideoStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localScreenStream) {
        localScreenStream.getTracks().forEach((t) => t.stop());
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // No screen share active and not voice active — don't show button
  if (!screenShareUserId && !localScreenStream && !webrtc.isVoiceActive) {
    return null;
  }

  // No screen share active — show start button (only when in voice call)
  if (!screenShareUserId && !localScreenStream) {
    return null; // Button is shown in VoiceControls instead
  }

  // Minimized state
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-20 md:bottom-16 right-3 z-[60] flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg shadow-lg"
      >
        🖥️ {isSharing ? '共有中' : `${screenShareUserName}の画面`}
        <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
      </button>
    );
  }

  // Screen share panel
  return (
    <div className="fixed inset-4 md:inset-auto md:bottom-16 md:right-4 md:w-[560px] md:h-auto z-[60] bg-gray-900 rounded-xl shadow-2xl overflow-hidden border border-gray-700 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          <span className="text-xs text-gray-300 font-medium">
            {isSharing ? '画面共有中' : `${screenShareUserName} の画面`}
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
              onClick={handleStopShare}
              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-medium rounded transition-colors"
            >
              共有停止
            </button>
          )}
        </div>
      </div>
      {/* Video */}
      {localScreenStream ? (
        <video ref={localVideoRef} autoPlay muted className="w-full aspect-video bg-black" />
      ) : hasRemoteVideo ? (
        <video ref={remoteVideoRef} autoPlay className="w-full aspect-video bg-black" />
      ) : (
        <div className="w-full aspect-video bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col items-center justify-center text-center px-4">
          <div className="text-3xl mb-3">🖥️</div>
          <div className="text-white text-sm font-medium">{screenShareUserName} が画面を共有中</div>
          <div className="text-gray-400 text-xs mt-2">通話に参加すると画面が表示されます</div>
        </div>
      )}
    </div>
  );
}
