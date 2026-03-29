'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import type { PresenceStatus } from '@/types';

const RECONNECT_INTERVAL = 10000;

interface WsSend {
  move: (x: number, y: number) => void;
  sit: (seatId: string, x: number, y: number) => void;
  stand: () => void;
  chat: (text: string) => void;
  status: (status: PresenceStatus) => void;
  media: (isMuted: boolean, isCameraOn: boolean) => void;
  reaction: (emoji: string) => void;
  sceneUpdate: () => void;
}

interface UseWebSocketOptions {
  floor: string;
  name: string;
  avatarStyle: string;
  avatarSeed: string;
}

// Convert Go WS flat user format to frontend User format
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toUser(raw: any) {
  return {
    id: raw.id,
    name: raw.name,
    role: raw.role || 'メンバー',
    avatarColor: raw.avatarColor || '#4F46E5',
    initials: raw.name ? raw.name[0] : 'G',
    status: raw.status || 'online',
    position: { x: raw.x ?? 200, y: raw.y ?? 200 },
    avatarStyle: raw.avatarStyle || 'notionists',
    avatarSeed: raw.avatarSeed || 'default',
  };
}

export function useWebSocket(options?: UseWebSocketOptions): { send: WsSend; connected: boolean } {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [connected, setConnected] = useState(false);

  const {
    setWsConnected,
    addRemoteUser,
    removeRemoteUser,
    updateRemoteUserPosition,
    updateRemoteUserSeat,
    updateRemoteUserStand,
    addChatMessage,
    updateRemoteUserStatus,
    setRemoteUsers,
    addNotification,
  } = useOfficeStore();

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const connect = useCallback(() => {
    const opts = optionsRef.current;
    if (!opts || !opts.floor || !opts.name) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const wsBaseUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws';
    const params = new URLSearchParams({
      floor: opts.floor,
      name: opts.name,
      avatar: opts.avatarStyle || 'notionists',
      seed: opts.avatarSeed || 'default',
    });
    const ws = new WebSocket(`${wsBaseUrl}?${params}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] Connected');
      setConnected(true);
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      const currentUserId = useOfficeStore.getState().currentUser.id;

      switch (msg.type) {
        case 'welcome':
          // Server assigned us a userId
          if (msg.userId) {
            useOfficeStore.setState((state) => ({
              currentUser: { ...state.currentUser, id: msg.userId },
            }));
          }
          setRemoteUsers(
            (msg.users || [])
              .filter((u: { id: string }) => u.id !== msg.userId)
              .map(toUser),
          );
          if (msg.chatHistory) {
            for (const chatMsg of msg.chatHistory) {
              addChatMessage(chatMsg.userId, chatMsg.text, chatMsg.timestamp);
            }
          }
          break;

        case 'user_joined':
          if (msg.user.id !== currentUserId) {
            const user = toUser(msg.user);
            addRemoteUser(user);
            addNotification(`${user.name} が入室しました`);
          }
          break;

        case 'user_left': {
          const leftUser = useOfficeStore.getState().users.find(u => u.id === msg.userId);
          removeRemoteUser(msg.userId);
          if (leftUser) {
            addNotification(`${leftUser.name} が退室しました`);
          }
          break;
        }

        case 'user_moved':
          updateRemoteUserPosition(msg.userId, msg.x, msg.y);
          break;

        case 'user_sat':
          updateRemoteUserSeat(msg.userId, msg.seatId, msg.x, msg.y);
          break;

        case 'user_stood':
          updateRemoteUserStand(msg.userId);
          break;

        case 'user_chat':
          addChatMessage(msg.message.userId, msg.message.text, msg.message.timestamp);
          break;

        case 'user_status':
          updateRemoteUserStatus(msg.userId, msg.status);
          break;

        case 'user_media':
          useOfficeStore.setState((state) => ({
            users: state.users.map(u =>
              u.id === msg.userId
                ? { ...u, isMuted: msg.isMuted ?? u.isMuted, isCameraOn: msg.isCameraOn ?? u.isCameraOn }
                : u
            ),
          }));
          break;

        case 'scene_updated':
          // Floor editor saved changes - reload scene
          addNotification('フロアが更新されました。再読み込みします...');
          setTimeout(() => window.location.reload(), 1500);
          break;

        case 'user_reaction':
          // Store reaction for display (auto-clear after 3s)
          useOfficeStore.setState((state) => ({
            reactions: { ...state.reactions, [msg.userId]: msg.emoji },
          }));
          setTimeout(() => {
            useOfficeStore.setState((state) => {
              const { [msg.userId]: _, ...rest } = state.reactions;
              return { reactions: rest };
            });
          }, 3000);
          break;
      }
    };

    ws.onclose = () => {
      console.log('[WS] Disconnected, will reconnect...');
      setConnected(false);
      setWsConnected(false);
      wsRef.current = null;
      reconnectTimerRef.current = setTimeout(connect, RECONNECT_INTERVAL);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [
    setWsConnected,
    addRemoteUser,
    removeRemoteUser,
    updateRemoteUserPosition,
    updateRemoteUserSeat,
    updateRemoteUserStand,
    addChatMessage,
    updateRemoteUserStatus,
    setRemoteUsers,
    addNotification,
  ]);

  useEffect(() => {
    if (options?.floor && options?.name) {
      connect();
    }
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect, options?.floor, options?.name]);

  const sendRaw = useCallback((data: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const send: WsSend = {
    move: useCallback(
      (x: number, y: number) => sendRaw({ type: 'move', x, y }),
      [sendRaw],
    ),
    sit: useCallback(
      (seatId: string, x: number, y: number) => sendRaw({ type: 'sit', seatId, x, y }),
      [sendRaw],
    ),
    stand: useCallback(() => sendRaw({ type: 'stand' }), [sendRaw]),
    chat: useCallback(
      (text: string) => sendRaw({ type: 'chat', text }),
      [sendRaw],
    ),
    status: useCallback(
      (status: PresenceStatus) => sendRaw({ type: 'status', status }),
      [sendRaw],
    ),
    media: useCallback(
      (isMuted: boolean, isCameraOn: boolean) => sendRaw({ type: 'media', isMuted, isCameraOn }),
      [sendRaw],
    ),
    reaction: useCallback(
      (emoji: string) => sendRaw({ type: 'reaction', emoji }),
      [sendRaw],
    ),
    sceneUpdate: useCallback(
      () => sendRaw({ type: 'scene_update' }),
      [sendRaw],
    ),
  };

  return { send, connected };
}
