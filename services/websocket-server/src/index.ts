import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { SignalingServer } from './SignalingServer.js';

const app = express();
const PORT = process.env.WS_SERVER_PORT || 4002;

app.use(cors());
app.use(express.json());

const server = createServer(app);

const wss = new WebSocketServer({ 
  server,
  path: '/ws',
});

const signalingServer = new SignalingServer(wss);


app.get('/health', (_: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'websocket-server',
    connections: wss.clients.size,
  });
});

app.get('/sessions/:sessionId', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const stats = signalingServer.getSessionStats(sessionId as string);

    if (!stats) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(stats);
  } catch (error) {
    console.error('Error getting session stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/sessions', (_: Request, res: Response) => {
  try {
    const sessions = signalingServer.getAllSessions();
    res.json({ sessions });
  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

server.listen(PORT, () => {
  console.log(`WebSocket signaling server running on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
