'use client';

import { useState, useEffect, useRef, use } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';

import FloorCanvas from '@/components/floor/FloorCanvas';
import EditorPanel from '@/components/editor/EditorPanel';
import AvatarSelector from '@/components/profile/AvatarSelector';
import NotificationToast from '@/components/layout/NotificationToast';

import JoinDialog from '@/components/JoinDialog';
import ChatView from '@/components/views/ChatView';
import MembersView from '@/components/views/MembersView';
import ProfileView from '@/components/views/ProfileView';
import RightPanel from '@/components/layout/RightPanel';
import DMPanel from '@/components/chat/DMPanel';
import { useOfficeStore } from '@/store/officeStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useIdleDetection } from '@/hooks/useIdleDetection';
import { WebSocketProvider } from '@/contexts/WebSocketContext';

const SpaceWizard = dynamic(() => import('@/components/editor/SpaceWizard'), { ssr: false });

interface FloorData {
  slug: string;
  name: string;
  excalidrawScene?: unknown;
  zones?: unknown;
  hasPassword?: boolean;
  hasOwnerPassword?: boolean;
}

export default function FloorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { editorMode, showAvatarSelector, currentUser, currentSeatId, viewMode, kickedNotification, activeDMUserId } = useOfficeStore();
  const [showSpaceWizard, setShowSpaceWizard] = useState(false);
  const [joined, setJoined] = useState(false);
  const [wsOptions, setWsOptions] = useState<{
    floor: string;
    name: string;
    avatarStyle: string;
    avatarSeed: string;
  } | undefined>(undefined);
  const [floorData, setFloorData] = useState<FloorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [autoJoinChecked, setAutoJoinChecked] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // Check if already authenticated as owner in this session
  useEffect(() => {
    const sessionOwner = sessionStorage.getItem(`ethereal-owner-${slug}`);
    if (sessionOwner === 'true') {
      setIsOwner(true);
      useOfficeStore.getState().setIsFloorOwner(true);
    } else {
      // Also check legacy editToken
      const tokens = JSON.parse(localStorage.getItem('ethereal-edit-tokens') || '{}');
      if (tokens[slug]) {
        fetch(`/api/floors/${slug}/verify-owner`, {
          method: 'POST',
          headers: { 'X-Edit-Token': tokens[slug], 'Content-Type': 'application/json' },
          body: JSON.stringify({ ownerPassword: '' }),
        })
          .then(res => res.json())
          .then(data => {
            if (data.canEdit) {
              setIsOwner(true);
              useOfficeStore.getState().setIsFloorOwner(true);
              sessionStorage.setItem(`ethereal-owner-${slug}`, 'true');
            }
          })
          .catch(() => {});
      }
    }
  }, [slug]);

  // Fetch floor data
  useEffect(() => {
    fetch(`/api/floors/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data) => {
        setFloorData(data);
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [slug]);

  // Auto-join on reload if user info exists in localStorage
  useEffect(() => {
    if (autoJoinChecked || joined || loading || notFound) return;
    setAutoJoinChecked(true);
    try {
      const saved = localStorage.getItem('ethereal-office-user');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.name) {
          handleJoin(data.name, data.avatarStyle || 'notionists', data.avatarSeed || 'default');
        }
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, notFound, autoJoinChecked, joined]);

  const { send, connected } = useWebSocket(wsOptions);
  useIdleDetection(send);

  const handleJoin = (name: string, avatarStyle: string, avatarSeed: string) => {
    // Set current user info in store
    useOfficeStore.setState((state) => ({
      currentUser: {
        ...state.currentUser,
        name,
        avatarStyle,
        avatarSeed,
      },
    }));

    setWsOptions({ floor: slug, name, avatarStyle, avatarSeed });
    setJoined(true);

    // Save to visit history
    const history = JSON.parse(localStorage.getItem('ethereal-visit-history') || '[]');
    const entry = { slug, name: floorData?.name || slug, visitedAt: new Date().toISOString() };
    const filtered = history.filter((h: { slug: string }) => h.slug !== slug);
    filtered.unshift(entry); // most recent first
    localStorage.setItem('ethereal-visit-history', JSON.stringify(filtered.slice(0, 20)));
  };

  // Keep refs to avoid stale closures
  const sendRef = useRef(send);
  sendRef.current = send;

  // Broadcast position changes
  const prevPosRef = useRef(currentUser.position);
  useEffect(() => {
    if (!joined) return;
    const pos = currentUser.position;
    if (pos.x !== prevPosRef.current.x || pos.y !== prevPosRef.current.y) {
      prevPosRef.current = pos;
      if (!currentSeatId) {
        sendRef.current.move(pos.x, pos.y);
      }
    }
  }, [currentUser.position, currentSeatId, joined]);

  // Broadcast status changes
  const prevStatusRef = useRef(currentUser.status);
  const prevStatusMsgRef = useRef(currentUser.statusMessage);
  useEffect(() => {
    if (!joined) return;
    if (currentUser.status !== prevStatusRef.current || currentUser.statusMessage !== prevStatusMsgRef.current) {
      prevStatusRef.current = currentUser.status;
      prevStatusMsgRef.current = currentUser.statusMessage;
      sendRef.current.status(currentUser.status, currentUser.statusMessage);
    }
  }, [currentUser.status, currentUser.statusMessage, joined]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
          <div className="text-5xl mb-4">🏢</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">フロアが見つかりません</h1>
          <p className="text-gray-500 text-sm mb-6">このURLのフロアは存在しないか、削除されました。</p>
          <a
            href="/"
            className="block w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors text-sm"
          >
            新しいフロアを作成する
          </a>
          <a href="/" className="block mt-3 text-sm text-gray-400 hover:text-gray-600">
            トップに戻る
          </a>
        </div>
      </div>
    );
  }

  if (!joined) {
    return <JoinDialog floorName={floorData?.name || 'フロア'} floorSlug={slug} hasPassword={floorData?.hasPassword} onJoin={handleJoin} />;
  }

  return (
    <WebSocketProvider value={{ send, connected }}>
      <div className="floor-page flex h-screen overflow-hidden bg-white">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <div className="flex-1 flex min-h-0">
            {viewMode === 'floor' && (
              <>
                <FloorCanvas floorSlug={slug} savedScene={floorData?.excalidrawScene} />
                {editorMode === 'edit' && <EditorPanel onAddSpace={() => setShowSpaceWizard(true)} floorSlug={slug} />}
                <RightPanel />
              </>
            )}
            {viewMode === 'meetings' && <MembersView />}
            {viewMode === 'chat' && <ChatView />}
            {viewMode === 'profile' && <ProfileView />}
          </div>
        </div>
        {showAvatarSelector && <AvatarSelector />}
        {showSpaceWizard && <SpaceWizard onClose={() => setShowSpaceWizard(false)} />}
        <NotificationToast />
        {activeDMUserId && <DMPanel />}
        {/* Kick notification overlay */}
        {kickedNotification && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              background: '#fff', borderRadius: 16, padding: '32px 40px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              textAlign: 'center', maxWidth: 360,
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🚫</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>
                フロアオーナーにより退出されました
              </div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>
                2秒後にトップページへ移動します...
              </div>
            </div>
          </div>
        )}
        {/* WS connection indicator - minimal, only show when disconnected */}
        {!connected && (
          <div className="fixed bottom-2 left-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs bg-red-50 border border-red-200 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <span className="text-red-500 font-medium">接続中...</span>
          </div>
        )}
      </div>
    </WebSocketProvider>
  );
}
