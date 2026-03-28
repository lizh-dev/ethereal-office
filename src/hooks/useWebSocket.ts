'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import type { PresenceStatus } from '@/types';

const WS_URL = 'ws://localhost:3001';
const RECONNECT_INTERVAL = 10000; // Don't spam reconnects when server is down

interface WsSend {
  move: (x: number, y: number) => void;
  sit: (seatId: string, x: number, y: number) => void;
  stand: () => void;
  chat: (text: string) => void;
  status: (status: PresenceStatus) => void;
}

export function useWebSocket(): { send: WsSend; connected: boolean } {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [connected, setConnected] = useState(false);

  const {
    currentUser,
    setWsConnected,
    addRemoteUser,
    removeRemoteUser,
    updateRemoteUserPosition,
    updateRemoteUserSeat,
    updateRemoteUserStand,
    addChatMessage,
    updateRemoteUserStatus,
    setRemoteUsers,
  } = useOfficeStore();

  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] Connected');
      setConnected(true);
      setWsConnected(true);

      // Send join message
      const user = currentUserRef.current;
      ws.send(
        JSON.stringify({
          type: 'join',
          user: {
            id: user.id,
            name: user.name,
            role: user.role,
            avatarColor: user.avatarColor,
            initials: user.initials,
            status: user.status,
            position: user.position,
            avatarStyle: user.avatarStyle,
            avatarSeed: user.avatarSeed,
          },
        }),
      );
    };

    ws.onmessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      switch (msg.type) {
        case 'welcome':
          // Set all remote users (excluding self)
          setRemoteUsers(
            msg.users.filter((u: { id: string }) => u.id !== currentUserRef.current.id),
          );
          // Load chat history
          if (msg.chatHistory) {
            for (const chatMsg of msg.chatHistory) {
              addChatMessage(chatMsg.userId, chatMsg.text, chatMsg.timestamp);
            }
          }
          break;

        case 'user_joined':
          if (msg.user.id !== currentUserRef.current.id) {
            addRemoteUser(msg.user);
          }
          break;

        case 'user_left':
          removeRemoteUser(msg.userId);
          break;

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
      }
    };

    ws.onclose = () => {
      console.log('[WS] Disconnected, will reconnect...');
      setConnected(false);
      setWsConnected(false);
      wsRef.current = null;

      // Schedule reconnect
      reconnectTimerRef.current = setTimeout(connect, RECONNECT_INTERVAL);
    };

    ws.onerror = (err) => {
      // Silently handle - WS server may not be running
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
  ]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

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
  };

  return { send, connected };
}
