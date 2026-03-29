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
import { useOfficeStore } from '@/store/officeStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useIdleDetection } from '@/hooks/useIdleDetection';

const SpaceWizard = dynamic(() => import('@/components/editor/SpaceWizard'), { ssr: false });

interface FloorData {
  slug: string;
  name: string;
  excalidrawScene?: unknown;
  zones?: unknown;
  hasPassword?: boolean;
}

export default function FloorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { editorMode, showAvatarSelector, currentUser, currentSeatId, viewMode } = useOfficeStore();
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

  // Verify edit permission with server
  useEffect(() => {
    const tokens = JSON.parse(localStorage.getItem('ethereal-edit-tokens') || '{}');
    const token = tokens[slug];
    if (!token) {
      setIsOwner(false);
      useOfficeStore.getState().setIsFloorOwner(false);
      return;
    }
    fetch(`/api/floors/${slug}/verify-token`, {
      method: 'POST',
      headers: { 'X-Edit-Token': token },
    })
      .then(res => res.json())
      .then(data => {
        setIsOwner(data.canEdit);
        useOfficeStore.getState().setIsFloorOwner(data.canEdit);
      })
      .catch(() => {
        setIsOwner(false);
        useOfficeStore.getState().setIsFloorOwner(false);
      });
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
  useIdleDetection();

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
  useEffect(() => {
    if (!joined) return;
    if (currentUser.status !== prevStatusRef.current) {
      prevStatusRef.current = currentUser.status;
      sendRef.current.status(currentUser.status);
    }
  }, [currentUser.status, joined]);

  // Expose send functions for child components
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__wsSend = send;
    return () => {
      delete (window as unknown as Record<string, unknown>).__wsSend;
    };
  }, [send]);

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
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <div className="flex-1 flex min-h-0">
          {viewMode === 'floor' && (
            <>
              <FloorCanvas floorSlug={slug} savedScene={floorData?.excalidrawScene} />
              {editorMode === 'edit' && <EditorPanel onAddSpace={() => setShowSpaceWizard(true)} floorSlug={slug} />}
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
