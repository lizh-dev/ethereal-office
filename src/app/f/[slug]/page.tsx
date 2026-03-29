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
import DMPanel from '@/components/chat/DMPanel';
import VoiceManager from '@/components/voice/VoiceManager';
import ActivityFeed from '@/components/views/ActivityFeed';
import { useOfficeStore } from '@/store/officeStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useIdleDetection } from '@/hooks/useIdleDetection';
import { WebSocketProvider } from '@/contexts/WebSocketContext';

const SpaceWizard = dynamic(() => import('@/components/editor/SpaceWizard'), { ssr: false });
import SetupGuide from '@/components/editor/SetupGuide';

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
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [showEditHint, setShowEditHint] = useState(false);
  const [showActivityFeed, setShowActivityFeed] = useState(false);
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
        // Restore zones from DB, or clear stale zones from previous floor
        if (data.zones && Array.isArray(data.zones) && data.zones.length > 0) {
          useOfficeStore.getState().setZones(data.zones);
        } else {
          useOfficeStore.getState().setZones([]);
        }
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

    // Show setup guide if floor has no zones (new floor)
    if (!floorData?.zones || !Array.isArray(floorData.zones) || floorData.zones.length === 0) {
      setShowSetupGuide(true);
    }

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
        {/* Edit button hint tooltip */}
        {showEditHint && (
          <div
            className="fixed z-[60] animate-float-in hidden md:block"
            style={{ left: 70, bottom: 60 }}
            onClick={() => setShowEditHint(false)}
          >
            <div className="bg-sky-500 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 cursor-pointer">
              <span className="text-lg">←</span>
              <div>
                <div>ここからフロアを編集できます</div>
                <div className="text-xs text-sky-100 font-normal mt-0.5">✏️ ボタンをクリックして開始</div>
              </div>
            </div>
            <div className="absolute -left-2 bottom-4 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-sky-500" />
          </div>
        )}
        {/* Mobile edit hint - appears above bottom tab bar */}
        {showEditHint && (
          <div
            className="fixed z-[60] animate-float-in md:hidden left-4 right-4 bottom-16"
            onClick={() => setShowEditHint(false)}
          >
            <div className="bg-sky-500 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 cursor-pointer justify-center">
              <div>
                <div className="text-center">下の「編集」タブからフロアを編集できます</div>
              </div>
            </div>
          </div>
        )}
        <div className="flex-1 flex flex-col min-w-0 pb-14 md:pb-0">
          <TopBar />
          <div className="flex-1 flex min-h-0">
            {viewMode === 'floor' && (
              <>
                <FloorCanvas floorSlug={slug} savedScene={floorData?.excalidrawScene} />
                {editorMode === 'edit' && <EditorPanel onAddSpace={() => setShowSpaceWizard(true)} floorSlug={slug} />}
                {/* Activity Feed toggle button */}
                {editorMode !== 'edit' && (
                  <button
                    onClick={() => setShowActivityFeed(v => !v)}
                    className={`fixed top-16 right-3 z-50 w-9 h-9 rounded-xl border flex items-center justify-center transition-all shadow-sm ${
                      showActivityFeed
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                        : 'bg-white/95 border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                    title="アクティビティ"
                  >
                    <span className="text-sm">&#x1F4CB;</span>
                  </button>
                )}
                {/* Activity Feed Panel */}
                {showActivityFeed && editorMode !== 'edit' && (
                  <div style={{
                    position: 'fixed', top: 56, right: 0, bottom: 0,
                    width: 260, zIndex: 40,
                    background: '#FAFAFA',
                    borderLeft: '1px solid #E5E7EB',
                    boxShadow: '-2px 0 12px rgba(0,0,0,0.06)',
                  }}>
                    <ActivityFeed />
                  </div>
                )}
              </>
            )}
            {viewMode === 'meetings' && <MembersView />}
            {viewMode === 'chat' && <ChatView />}
            {viewMode === 'profile' && <ProfileView />}
          </div>
        </div>
        {showSetupGuide && (
          <SetupGuide
            onStartSetup={() => {
              setShowSetupGuide(false);
              useOfficeStore.getState().setEditorMode('edit');
              setShowSpaceWizard(true);
            }}
            onSkip={() => { setShowSetupGuide(false); setShowEditHint(true); setTimeout(() => setShowEditHint(false), 6000); }}
          />
        )}
        {showAvatarSelector && <AvatarSelector />}
        {showSpaceWizard && <SpaceWizard onClose={() => setShowSpaceWizard(false)} />}
        <NotificationToast />
        {activeDMUserId && <DMPanel />}
        <VoiceManager />
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
          <div className="fixed bottom-16 md:bottom-2 left-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs bg-red-50 border border-red-200 shadow-sm z-50">
            <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <span className="text-red-500 font-medium">接続中...</span>
          </div>
        )}
      </div>
    </WebSocketProvider>
  );
}
