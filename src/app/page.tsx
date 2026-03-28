'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import RightPanel from '@/components/layout/RightPanel';
import FloorCanvas from '@/components/floor/FloorCanvas';
import EditorPanel from '@/components/editor/EditorPanel';
import AvatarSelector from '@/components/profile/AvatarSelector';
import NotificationToast from '@/components/layout/NotificationToast';
import { useOfficeStore } from '@/store/officeStore';
import { useWebSocket } from '@/hooks/useWebSocket';

const SpaceWizard = dynamic(() => import('@/components/editor/SpaceWizard'), { ssr: false });

export default function Home() {
  const { editorMode, showAvatarSelector, currentUser, currentSeatId, wsConnected } = useOfficeStore();
  const [showSpaceWizard, setShowSpaceWizard] = useState(false);
  const { send, connected } = useWebSocket();

  // Generate unique user ID on client mount (avoids hydration mismatch)
  useEffect(() => {
    if (currentUser.id === 'pending') {
      const num = Math.floor(Math.random() * 1000);
      useOfficeStore.setState({
        currentUser: {
          ...currentUser,
          id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: `ユーザー${num}`,
          avatarSeed: `user-${num}`,
        },
      });
    }
  }, [currentUser]);

  // Keep refs to avoid stale closures in subscriptions
  const sendRef = useRef(send);
  sendRef.current = send;

  // Subscribe to position changes and broadcast via WS
  const prevPosRef = useRef(currentUser.position);
  useEffect(() => {
    const pos = currentUser.position;
    if (pos.x !== prevPosRef.current.x || pos.y !== prevPosRef.current.y) {
      prevPosRef.current = pos;
      // If sitting at a seat, the sit message is sent separately
      if (!currentSeatId) {
        sendRef.current.move(pos.x, pos.y);
      }
    }
  }, [currentUser.position, currentSeatId]);

  // Subscribe to status changes
  const prevStatusRef = useRef(currentUser.status);
  useEffect(() => {
    if (currentUser.status !== prevStatusRef.current) {
      prevStatusRef.current = currentUser.status;
      sendRef.current.status(currentUser.status);
    }
  }, [currentUser.status]);

  // Expose send functions for child components via store or context
  // For now, we attach them to window for simplicity
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__wsSend = send;
    return () => {
      delete (window as unknown as Record<string, unknown>).__wsSend;
    };
  }, [send]);

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <div className="flex-1 flex min-h-0">
          <FloorCanvas />
          {editorMode === 'edit' && <EditorPanel onAddSpace={() => setShowSpaceWizard(true)} />}
          <RightPanel />
        </div>
      </div>
      {showAvatarSelector && <AvatarSelector />}
      {showSpaceWizard && <SpaceWizard onClose={() => setShowSpaceWizard(false)} />}
      <NotificationToast />
      {/* WS connection indicator */}
      <div
        className="fixed bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full text-xs bg-white/80 backdrop-blur shadow-sm border border-gray-200"
        title={connected ? 'WebSocket connected' : 'WebSocket disconnected'}
      >
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-400'}`} />
        <span className="text-gray-500">{connected ? 'Online' : 'Offline'}</span>
      </div>
    </div>
  );
}
