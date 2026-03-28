import { WebSocketServer, WebSocket } from 'ws';
import crypto from 'crypto';

// ---- Types (mirror client-side types) ----

type PresenceStatus = 'online' | 'busy' | 'focusing' | 'offline';
type UserAction = 'working' | 'meeting' | 'break' | 'away' | 'idle';

interface Position {
  x: number;
  y: number;
}

interface ServerUser {
  id: string;
  name: string;
  role?: string;
  avatarColor: string;
  initials: string;
  status: PresenceStatus;
  position: Position;
  avatarStyle?: string;
  avatarSeed?: string;
  action: UserAction;
  seatId: string | null;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

// ---- Message types ----

type ClientMessage =
  | { type: 'join'; user: Omit<ServerUser, 'action' | 'seatId'> }
  | { type: 'move'; x: number; y: number }
  | { type: 'sit'; seatId: string; x: number; y: number }
  | { type: 'stand' }
  | { type: 'chat'; text: string }
  | { type: 'status'; status: PresenceStatus };

type ServerMessage =
  | { type: 'welcome'; userId: string; users: ServerUser[]; chatHistory: ChatMessage[] }
  | { type: 'user_joined'; user: ServerUser }
  | { type: 'user_left'; userId: string }
  | { type: 'user_moved'; userId: string; x: number; y: number }
  | { type: 'user_sat'; userId: string; seatId: string; x: number; y: number }
  | { type: 'user_stood'; userId: string }
  | { type: 'user_chat'; message: ChatMessage }
  | { type: 'user_status'; userId: string; status: PresenceStatus };

// ---- Server state ----

const connectedUsers = new Map<string, ServerUser>();
const clientSockets = new Map<string, WebSocket>();
const chatHistory: ChatMessage[] = [];
const MAX_CHAT_HISTORY = 100;

function generateId(): string {
  return crypto.randomUUID();
}

// ---- WebSocket server ----

const PORT = 3001;
const wss = new WebSocketServer({ port: PORT });

console.log(`[WS] WebSocket server running on ws://localhost:${PORT}`);

function broadcast(message: ServerMessage, excludeUserId?: string) {
  const data = JSON.stringify(message);
  for (const [uid, ws] of clientSockets.entries()) {
    if (uid !== excludeUserId && ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }
}

function sendToClient(ws: WebSocket, message: ServerMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

wss.on('connection', (ws: WebSocket) => {
  let userId: string | null = null;

  ws.on('message', (raw: Buffer) => {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    switch (msg.type) {
      case 'join': {
        const uid = msg.user.id || generateId();
        userId = uid;
        const serverUser: ServerUser = {
          ...msg.user,
          id: uid,
          action: 'idle',
          seatId: null,
        };

        connectedUsers.set(uid, serverUser);
        clientSockets.set(uid, ws);

        // Send welcome with full state
        sendToClient(ws, {
          type: 'welcome',
          userId: uid,
          users: Array.from(connectedUsers.values()),
          chatHistory: chatHistory.slice(-50),
        });

        // Broadcast join to others
        broadcast({ type: 'user_joined', user: serverUser }, uid);

        console.log(`[WS] User joined: ${serverUser.name} (${uid})`);
        break;
      }

      case 'move': {
        if (!userId) return;
        const uid = userId;
        const user = connectedUsers.get(uid);
        if (user) {
          user.position = { x: msg.x, y: msg.y };
          user.seatId = null;
          user.action = 'idle';
          broadcast({ type: 'user_moved', userId: uid, x: msg.x, y: msg.y }, uid);
        }
        break;
      }

      case 'sit': {
        if (!userId) return;
        const uid = userId;
        const user = connectedUsers.get(uid);
        if (user) {
          user.position = { x: msg.x, y: msg.y };
          user.seatId = msg.seatId;
          broadcast({ type: 'user_sat', userId: uid, seatId: msg.seatId, x: msg.x, y: msg.y }, uid);
        }
        break;
      }

      case 'stand': {
        if (!userId) return;
        const uid = userId;
        const user = connectedUsers.get(uid);
        if (user) {
          user.seatId = null;
          user.action = 'idle';
          broadcast({ type: 'user_stood', userId: uid }, uid);
        }
        break;
      }

      case 'chat': {
        if (!userId) return;
        const uid = userId;
        const user = connectedUsers.get(uid);
        if (!user) return;
        const chatMsg: ChatMessage = {
          id: generateId(),
          userId: uid,
          userName: user.name,
          text: msg.text,
          timestamp: Date.now(),
        };
        chatHistory.push(chatMsg);
        if (chatHistory.length > MAX_CHAT_HISTORY) {
          chatHistory.shift();
        }
        // Broadcast to ALL including sender
        broadcast({ type: 'user_chat', message: chatMsg });
        break;
      }

      case 'status': {
        if (!userId) return;
        const uid = userId;
        const user = connectedUsers.get(uid);
        if (user) {
          user.status = msg.status;
          broadcast({ type: 'user_status', userId: uid, status: msg.status }, uid);
        }
        break;
      }
    }
  });

  ws.on('close', () => {
    if (userId) {
      const uid = userId;
      connectedUsers.delete(uid);
      clientSockets.delete(uid);
      broadcast({ type: 'user_left', userId: uid });
      console.log(`[WS] User disconnected: ${uid}`);
    }
  });

  ws.on('error', (err) => {
    console.error(`[WS] Error for ${userId}:`, err.message);
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('[WS] Shutting down...');
  wss.close(() => process.exit(0));
});
