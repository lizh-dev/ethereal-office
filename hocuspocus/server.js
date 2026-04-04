const { Server } = require('@hocuspocus/server');

const server = new Server({
  port: 3002,
  async onConnect({ documentName }) {
    console.log(`[connect] ${documentName}`);
  },
  async onDisconnect({ documentName }) {
    console.log(`[disconnect] ${documentName}`);
  },
});

server.listen();
