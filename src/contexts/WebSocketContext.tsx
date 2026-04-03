'use client';
import { createContext, useContext } from 'react';
import type { PresenceStatus } from '@/types';

export interface WsSend {
  move: (x: number, y: number) => void;
  sit: (seatId: string, x: number, y: number) => void;
  stand: () => void;
  chat: (text: string) => void;
  status: (status: PresenceStatus, statusMessage?: string) => void;
  media: (isMuted: boolean, isCameraOn: boolean) => void;
  reaction: (emoji: string) => void;
  sceneUpdate: () => void;
  kick: (targetUserId: string) => void;
  profileUpdate: (name: string, avatarStyle: string, avatarSeed: string) => void;
  dm: (targetUserId: string, text: string) => void;
  whisper: (text: string) => void;
  callRequest: (targetUserId: string) => void;
  callAccept: (targetUserId: string) => void;
  callDecline: (targetUserId: string) => void;
  callEnd: (targetUserId: string) => void;
  boardUpdate: (meetingId: string, boardData: string) => void;
  meetingStart: (meetingId: string, meetingName: string, hasPassword: boolean, password?: string) => void;
  meetingJoin: (meetingId: string) => void;
  meetingLeave: (meetingId: string) => void;
}

const WebSocketContext = createContext<{ send: WsSend; connected: boolean } | null>(null);

export const WebSocketProvider = WebSocketContext.Provider;

export function useWsSend(): WsSend {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error('useWsSend must be used within WebSocketProvider');
  return ctx.send;
}

export function useWsConnected(): boolean {
  const ctx = useContext(WebSocketContext);
  return ctx?.connected ?? false;
}
