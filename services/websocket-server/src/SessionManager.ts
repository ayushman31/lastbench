import { v4 as uuidv4 } from 'uuid';
import type { Session, Client } from './types.js';

export class SessionManager {
  private sessions = new Map<string, Session>();
  private clients = new Map<string, Client>();

// create a new session
  createSession(hostId: string, hostName?: string, maxParticipants: number = 10): Session {
    const sessionId = uuidv4();

    const session: Session = {
      id: sessionId,
      hostId,
      hostName,
      participants: new Map(),
      maxParticipants,
      createdAt: new Date(),
    };

    this.sessions.set(sessionId, session);

    console.log(`Session created: ${sessionId} by host ${hostId}`);
    return session;
  }

  // create a session with a specific ID (for database sessions)
  createSessionWithId(sessionId: string, hostId: string, hostName?: string, maxParticipants: number = 10): Session {
    // check if session already exists
    if (this.sessions.has(sessionId)) {
      console.log(`Session ${sessionId} already exists, returning existing session`);
      return this.sessions.get(sessionId)!;
    }

    const session: Session = {
      id: sessionId, // use provided ID instead of generating new one
      hostId,
      hostName,
      participants: new Map(),
      maxParticipants,
      createdAt: new Date(),
    };

    this.sessions.set(sessionId, session);

    console.log(`Session created with ID: ${sessionId} by host ${hostId}`);
    return session;
  }
  
// get session by id
  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

// add client to session
  addClientToSession(sessionId: string, client: Client): boolean {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.participants.size >= session.maxParticipants) {
      throw new Error('Session is full');
    }

    if (session.participants.has(client.id)) {
      throw new Error('Client already in session');
    }

    session.participants.set(client.id, client);
    client.sessionId = sessionId;

    console.log(`Client ${client.id} joined session ${sessionId}`);
    return true;
  }

// remove client from session
  removeClientFromSession(clientId: string): string | null {
    const client = this.clients.get(clientId);
    if (!client || !client.sessionId) return null;

    const session = this.sessions.get(client.sessionId);
    if (!session) return null;

    session.participants.delete(clientId);
    const sessionId = client.sessionId;
    client.sessionId = null;

    console.log(`Client ${clientId} left session ${sessionId}`);

    // Clean up empty sessions (except if host is still there)
    if (session.participants.size === 0) {
      this.sessions.delete(sessionId);
      console.log(`Session ${sessionId} deleted (empty)`);
    }

    return sessionId;
  }

// register a new client
  registerClient(client: Client): void {
    this.clients.set(client.id, client);
    console.log(`Client registered: ${client.id}`);
  }

// unregister client
  unregisterClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client && client.sessionId) {
      this.removeClientFromSession(clientId);
    }
    this.clients.delete(clientId);
    console.log(`Client unregistered: ${clientId}`);
  }

// get client by id
  getClient(clientId: string): Client | undefined {
    return this.clients.get(clientId);
  }

// get all clients in a session
  getSessionClients(sessionId: string): Client[] {
    const session = this.sessions.get(sessionId);
    return session ? Array.from(session.participants.values()) : [];
  }

// get session stats
  getSessionStats(sessionId: string): any {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const participants = Array.from(session.participants.values()).map((client: Client) => ({
      id: client.id,
      userId: client.userId,
      userName: client.userName,
      isHost: client.isHost,
      joinedAt: client.joinedAt,
      connectionQuality: client.connectionQuality,
    }));

    return {
      sessionId: session.id,
      hostId: session.hostId,
      hostName: session.hostName,
      participantCount: session.participants.size,
      maxParticipants: session.maxParticipants,
      duration: Math.floor((Date.now() - session.createdAt.getTime()) / 1000),
      participants,
      createdAt: session.createdAt,
    };
  }

// get all active sessions
  getAllSessions(): Session[] {
    return Array.from(this.sessions.values());
  }

// update connection quality for client
  updateConnectionQuality(clientId: string, quality: any): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.connectionQuality = {
        ...quality,
        lastUpdated: new Date(),
      };
    }
  }

// check for stale clients (no ping in 30 seconds)
  cleanupStaleClients(): number {
    const now = Date.now();
    const staleThreshold = 30000; // 30 seconds
    let cleaned = 0;

    this.clients.forEach((client, clientId) => {
      const timeSinceLastPing = now - client.lastPing.getTime();
      if (timeSinceLastPing > staleThreshold) {
        console.log(`Cleaning up stale client: ${clientId}`);
        this.unregisterClient(clientId);
        client.ws.terminate();
        cleaned++;
      }
    });

    return cleaned;
  }
}
