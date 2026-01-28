import WebSocket, { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { SessionManager } from './SessionManager.js';
import type { SignalingMessage, Client, JoinSessionMessage, WebRTCSignal, Session } from './types.js';

export class SignalingServer {
  private wss: WebSocketServer;
  private sessionManager: SessionManager;

  constructor(wss: WebSocketServer) {
    this.wss = wss;
    this.sessionManager = new SessionManager();

    this.setupServer();
    this.startCleanupInterval();
  }

  private setupServer(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      const clientId = uuidv4();
      console.log(`New WebSocket connection: ${clientId}`);

      // create client object (will be fully initialized on join-session)
      const client: Client = {
        id: clientId,
        userId: '', // Set when joining session
        userName: undefined,
        sessionId: null,
        ws,
        isHost: false,
        joinedAt: new Date(),
        lastPing: new Date(),
      };

      this.sessionManager.registerClient(client);

      // send client their id
      this.sendMessage(ws, {
        type: 'session-update',
        data: { clientId },
        timestamp: Date.now(),
      });

      // setup message handler
      ws.on('message', (data: string) => {
        this.handleMessage(client, data);
      });

      // setup close handler
      ws.on('close', () => {
        this.handleDisconnect(client);
      });

      // setup error handler
      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
      });

      // setup ping handler
      ws.on('pong', () => {
        client.lastPing = new Date();
      });
    });

    console.log('WebSocket signaling server initialized');
  }

  private handleMessage(client: Client, data: string): void {
    try {
      const message: SignalingMessage = JSON.parse(data);
      message.timestamp = Date.now();

      console.log(`Message from ${client.id}:`, message.type);

      switch (message.type) {
        case 'join-session':
          this.handleJoinSession(client, message.data as JoinSessionMessage);
          break;

        case 'leave-session':
          this.handleLeaveSession(client);
          break;

        case 'offer':
        case 'answer':
        case 'ice-candidate':
          this.handleWebRTCSignal(client, message as WebRTCSignal);
          break;

        case 'ping':
          this.handlePing(client);
          break;

        default:
          console.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      this.sendError(client.ws, 'Invalid message format');
    }
  }

  private handleJoinSession(client: Client, data: JoinSessionMessage): void {
    try {
      const { sessionId, userId, userName, isHost } = data;

      // update client info
      client.userId = userId;
      client.userName = userName;
      client.isHost = isHost || false;

      let session = this.sessionManager.getSession(sessionId);

      // create session if host and doesn't exist
      if (isHost && !session) {
        session = this.sessionManager.createSession(client.id, userName);
      }

      if (!session) {
        throw new Error('Session not found');
      }

      // add client to session
      this.sessionManager.addClientToSession(session.id, client);

      // notify client of successful join
      this.sendMessage(client.ws, {
        type: 'session-update',
        sessionId: session.id,
        data: {
          joined: true,
          sessionId: session.id,
          clientId: client.id,
          isHost: client.isHost,
        },
        timestamp: Date.now(),
      });

      // notify all other participants about new peer
      this.broadcastToSession(
        session.id,
        {
          type: 'peer-joined',
          sessionId: session.id,
          from: client.id,
          data: {
            clientId: client.id,
            userId: client.userId,
            userName: client.userName,
            isHost: client.isHost,
          },
          timestamp: Date.now(),
        },
        client.id // Exclude sender
      );

      // send existing participants to new client
      const existingParticipants = this.sessionManager
        .getSessionClients(session.id)
        .filter((c: Client) => c.id !== client.id)
        .map((c: Client) => ({
          clientId: c.id,
          userId: c.userId,
          userName: c.userName,
          isHost: c.isHost,
        }));

      this.sendMessage(client.ws, {
        type: 'session-update',
        sessionId: session.id,
        data: {
          participants: existingParticipants,
        },
        timestamp: Date.now(),
      });

      console.log(`Client ${client.id} joined session ${session.id}`);
    } catch (error) {
      console.error('Error joining session:', error);
      this.sendError(client.ws, (error as Error).message);
    }
  }

  private handleLeaveSession(client: Client): void {
    const sessionId = this.sessionManager.removeClientFromSession(client.id);

    if (sessionId) {
      // notify other participants
      this.broadcastToSession(sessionId, {
        type: 'peer-left',
        sessionId,
        from: client.id,
        data: {
          clientId: client.id,
          userId: client.userId,
        },
        timestamp: Date.now(),
      });

      console.log(`Client ${client.id} left session ${sessionId}`);
    }
  }

  private handleWebRTCSignal(client: Client, signal: WebRTCSignal): void {
    if (!client.sessionId) {
      this.sendError(client.ws, 'Not in a session');
      return;
    }

    const { to, type, data } = signal;

    if (!to) {
      this.sendError(client.ws, 'Missing recipient');
      return;
    }

    const recipient = this.sessionManager.getClient(to);

    if (!recipient || recipient.sessionId !== client.sessionId) {
      this.sendError(client.ws, 'Recipient not found in session');
      return;
    }

    // forward webrtc signal to recipient
    this.sendMessage(recipient.ws, {
      type,
      from: client.id,
      to,
      sessionId: client.sessionId,
      data,
      timestamp: Date.now(),
    });

    console.log(`Forwarded ${type} from ${client.id} to ${to}`);
  }

  private handlePing(client: Client): void {
    client.lastPing = new Date();
    this.sendMessage(client.ws, {
      type: 'pong',
      timestamp: Date.now(),
    });
  }

  private handleDisconnect(client: Client): void {
    console.log(`Client disconnected: ${client.id}`);

    if (client.sessionId) {
      this.handleLeaveSession(client);
    }

    this.sessionManager.unregisterClient(client.id);
  }

  private sendMessage(ws: WebSocket, message: SignalingMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: WebSocket, error: string): void {
    this.sendMessage(ws, {
      type: 'error',
      data: { error },
      timestamp: Date.now(),
    });
  }

  private broadcastToSession(
    sessionId: string,
    message: SignalingMessage,
    excludeClientId?: string
  ): void {
    const clients = this.sessionManager.getSessionClients(sessionId);

    clients.forEach((client: Client) => {
      if (client.id !== excludeClientId) {
        this.sendMessage(client.ws, message);
      }
    });
  }

  private startCleanupInterval(): void {
    // ping all clients every 10 seconds
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        }
      });
    }, 10000);

    // clean up stale clients every 30 seconds
    setInterval(() => {
      const cleaned = this.sessionManager.cleanupStaleClients();
      if (cleaned > 0) {
        console.log(`Cleaned up ${cleaned} stale clients`);
      }
    }, 30000);
  }

  getSessionStats(sessionId: string): any {
    return this.sessionManager.getSessionStats(sessionId);
  }

  getAllSessions(): any[] {
    return this.sessionManager
      .getAllSessions()
      .map((session: Session) => this.sessionManager.getSessionStats(session.id));
  }
}
