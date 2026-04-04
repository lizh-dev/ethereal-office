const { Server } = require('@hocuspocus/server');

const API_URL = process.env.API_INTERNAL_URL || 'http://api:8080';

const server = new Server({
  port: 3002,

  async onAuthenticate({ token, documentName }) {
    if (!token) throw new Error('No token provided');

    let parsed;
    try {
      parsed = JSON.parse(token);
    } catch {
      throw new Error('Invalid token format');
    }

    const { floor, boardId } = parsed;
    if (!floor || !boardId) throw new Error('Missing floor or boardId');

    const url = `${API_URL}/api/floors/${encodeURIComponent(floor)}/board-access?boardId=${encodeURIComponent(boardId)}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`[auth-denied] ${documentName} floor=${floor} boardId=${boardId} status=${res.status}`);
      throw new Error('Access denied');
    }

    const data = await res.json();
    if (!data.allowed) {
      console.log(`[auth-denied] ${documentName} floor=${floor} boardId=${boardId} error=${data.error}`);
      throw new Error(data.error || 'Board access denied');
    }

    console.log(`[auth-ok] ${documentName} floor=${floor}`);
  },

  async onConnect({ documentName }) {
    console.log(`[connect] ${documentName}`);
  },

  async onDisconnect({ documentName }) {
    console.log(`[disconnect] ${documentName}`);
  },
});

server.listen();
