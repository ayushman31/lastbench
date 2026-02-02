import type { WebSocket } from 'ws';

export type MessageType =
  | 'join-session'
  | 'leave-session'
  | 'offer'
  | 'answer'
  | 'ice-candidate'
  | 'peer-joined'
  | 'peer-left'
  | 'session-update'
  | 'error'
  | 'ping'
  | 'pong';

export interface SignalingMessage {
  type: MessageType;
  from?: string;
  to?: string;
  sessionId?: string;
  data?: any;
  timestamp: number;
}

export interface Client {
  id: string;
  userId: string;
  userName?: string;
  sessionId: string | null;
  ws: WebSocket;
  isHost: boolean;
  isGuest: boolean;
  joinedAt: Date;
  lastPing: Date;
  connectionQuality?: ConnectionQuality;
}

export interface Session {
  id: string;
  hostId: string;
  hostName?: string;
  participants: Map<string, Client>;
  maxParticipants: number;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface ConnectionQuality {
  latency: number;
  packetLoss: number;
  bandwidth: number;
  lastUpdated: Date;
}

export interface JoinSessionMessage {
  sessionId: string;
  isHost?: boolean;
}

export interface WebRTCSignal {
  type: 'offer' | 'answer' | 'ice-candidate';
  from: string;
  to: string;
  data: any;
}

export interface SessionStats {
  sessionId: string;
  participantCount: number;
  duration: number;
  participants: Array<{
    id: string;
    userId: string;
    userName?: string;
    isHost: boolean;
    joinedAt: Date;
    connectionQuality?: ConnectionQuality;
  }>;
}

export interface RateLimitConfig {
  windowMs: number; // in ms
  maxMessages: number; // max messages per window
}

export interface ClientRateLimit {
  count: number;
  resetTime: number;
}

// session service types

export interface CreateSessionInput {
  hostId: string;
  hostName?: string;
  title?: string;
  description?: string;
  maxGuests?: number;
  expiresInHours?: number;
}

export interface JoinAsGuestInput {
  inviteToken: string;
  guestName?: string;
  guestEmail?: string;
  clientId: string;
}