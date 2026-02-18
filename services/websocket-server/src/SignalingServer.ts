import WebSocket, { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { SessionManager } from './SessionManager.js';
import type { SignalingMessage, Client, JoinSessionMessage, WebRTCSignal, Session } from './types.js';
import { verifySession } from './auth.js';
import { RateLimiter } from './rateLimiter.js';
import { SessionService } from './SessionService.js';

export class SignalingServer {
  private wss: WebSocketServer;
  private sessionManager: SessionManager;
  private rateLimiter = new RateLimiter({ windowMs: 1000, maxMessages: 50 }); // TODO : test with 10 as well

  constructor(wss: WebSocketServer) {
    this.wss = wss;
    this.sessionManager = new SessionManager();

    this.setupServer();
    this.startCleanupInterval();
  }

  private setupServer(): void {
    this.wss.on('connection', async (ws: WebSocket , request) => {
      const session = await verifySession(request);

      if (!session) {
        console.warn('Unauthorized WebSocket connection attempt');
        ws.close(1008, 'Unauthorized');
        return;
      }

      const clientId = uuidv4();
      console.log(`New WebSocket connection: ${clientId} (${session.isGuest ? 'guest' : 'user'}: ${session.userId})`);

      // create authenticated client object
      const client: Client = {
        id: clientId,
        userId: session.userId,
        userName: session.name || undefined,
        sessionId: null,
        ws,
        isHost: false, //will be setup by server logic not client
        isGuest: session.isGuest,
        joinedAt: new Date(),
        lastPing: new Date(),
      };

      this.sessionManager.registerClient(client);

      // send client their id
      this.sendMessage(ws, {
        type: 'session-update',
        data: { clientId, userId: session.userId, userName: session.name || undefined, isGuest: session.isGuest },
        timestamp: Date.now(),
      });
      
      // If guest, auto-join the session they were invited to
      if (session.isGuest && session.inviteToken) {
        await this.handleGuestAutoJoin(client, session.inviteToken);
      }

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

  private async handleGuestAutoJoin(client: Client, inviteToken: string): Promise<void> {
    try {
      const result = await SessionService.joinAsGuest({
        inviteToken,
        clientId: client.id,
        guestName: client.userName,
      });

      // add client to in-memory session
      // let session = this.sessionManager.getSession(result.session.id);
      // if (!session) {
      //   console.log(`Guest ${client.id} waiting for host to start session ${result.session.id}`);
      //   return;
      // }

      // this.sessionManager.addClientToSession(session.id, client);

      // // notify host that guest joined
      // this.broadcastToSession(
      //   session.id,
      //   {
      //     type: 'peer-joined',
      //     sessionId: session.id,
      //     from: client.id,
      //     data: {
      //       clientId: client.id,
      //       userId: client.userId,
      //       userName: client.userName || 'Guest',
      //       isGuest: true,
      //     },
      //     timestamp: Date.now(),
      //   },
      //   client.id
      // );

      // console.log(`Guest ${client.id} auto-joined session ${session.id}`);

      console.log(`Guest ${client.id} validated for session ${result.session.id}, waiting for explicit join`);
      
      // NOTE: Guest will join the session later when they send 'join-session' message
      // This allows them to go through lobby screen first
    } catch (error) {
      console.error('Guest validation failed:', error);
      this.sendError(client.ws, (error as Error).message);
    }
  }

  private handleMessage(client: Client, data: string): void {
    if (!this.rateLimiter.checkLimit(client.id)) {
      this.sendError(client.ws, 'Rate limit exceeded');
      return;
    }

    if (data.length > 10000) { // 10KB max
      this.sendError(client.ws, 'Message too large');
      return;
    }

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
      const { sessionId, isHost, userName } = data;
      
      console.log(`[SignalingServer] Client ${client.id} joining session ${sessionId} as ${isHost ? 'host' : 'guest'}, name: ${userName}`);

      // set the client's userName if provided
      if (userName) {
        client.userName = userName;
      }

      // Check if client is already in this session
      if (client.sessionId === sessionId) {
        console.log(`[SignalingServer] Client ${client.id} already in session ${sessionId}`);
        // Send confirmation again
        this.sendMessage(client.ws, {
          type: 'session-update',
          sessionId: sessionId,
          data: {
            joined: true,
            userId: client.userId,
            userName: client.userName,
            sessionId: sessionId,
            clientId: client.id,
            isHost: client.isHost,
          },
          timestamp: Date.now(),
        });
        return;
      }

      let session = this.sessionManager.getSession(sessionId);
      const userIsHost = isHost && !session; // only first person can be host

      // create session if host and doesn't exist
      if (userIsHost) {
        session = this.sessionManager.createSessionWithId(sessionId, client.id, client.userName);
        console.log(`[SignalingServer] Created new in-memory session: ${sessionId}`);
      }

      if (!session) {
        console.error(`[SignalingServer] Session ${sessionId} not found`);
        throw new Error('Session not found');
      }

      if (isHost && session.hostId !== client.id) {
        console.error(`[SignalingServer] Client ${client.id} is not host of session ${sessionId}`);
        throw new Error('You are not the host of this session');
      }
      
      client.isHost = userIsHost || false;

      // add client to session
      this.sessionManager.addClientToSession(session.id, client);

      // Get ALL participants INCLUDING the one that just joined
      const allSessionParticipants = Array.from(session.participants.values())
        .filter(p => p.id !== client.id) // Exclude the joining client from the list sent to them
        .map(p => ({
          clientId: p.id,
          userId: p.userId,
          userName: p.userName,
          isHost: p.isHost || false,
          isGuest: p.isGuest || false,
        }));

      console.log(`[SignalingServer] Sending session-update to ${client.id} with ${allSessionParticipants.length} participants:`, allSessionParticipants.map(p => p.userName));

      // notify client of successful join WITH list of existing participants
      this.sendMessage(client.ws, {
        type: 'session-update',
        sessionId: session.id,
        data: {
          joined: true,
          userId: client.userId,
          userName: client.userName,
          sessionId: session.id,
          clientId: client.id,
          isHost: client.isHost,
          participants: allSessionParticipants, // Include list of existing participants
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
            isGuest: client.isGuest,
          },
          timestamp: Date.now(),
        },
        client.id // Exclude sender
      );

      // send existing participants to new client
      // const existingParticipants = this.sessionManager
      //   .getSessionClients(session.id)
      //   .filter((c: Client) => c.id !== client.id)
      //   .map((c: Client) => ({
      //     clientId: c.id,
      //     userId: c.userId,
      //     userName: c.userName,
      //     isHost: c.isHost,
      //   }));

      // this.sendMessage(client.ws, {
      //   type: 'session-update',
      //   sessionId: session.id,
      //   data: {
      //     participants: existingParticipants,
      //   },
      //   timestamp: Date.now(),
      // });

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
      if (message.type === 'session-update') {
        console.log('[SignalingServer] Sending message:', JSON.stringify(message, null, 2));
      }
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
