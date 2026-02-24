export type MessageType =
  | 'join-session'
  | 'leave-session'
  | 'offer'
  | 'answer'
  | 'ice-candidate'
  | 'peer-joined'
  | 'peer-left'
  | 'session-update'
  | 'start-recording'
  | 'stop-recording'
  | 'recording-started'
  | 'recording-stopped'
  | 'error'
  | 'ping'
  | 'pong';

export interface SignalingMessage {
  type: MessageType;
  from?: string;
  to?: string;
  sessionId?: string;
  data?: any; // SesionInfo ? or we have to create a new type for the data : SignalingMessageData
  timestamp: number;
}

export interface Participant {
  clientId: string;
  userId: string;
  userName: string;
  isHost: boolean;
  isGuest: boolean;
  stream?: MediaStream;
  peerConnection?: RTCPeerConnection;
}

export interface SessionInfo {
  id: string;
  hostName: string;
  title: string;
  description?: string;
  currentGuests: number;
  maxGuests: number;
  expiresAt: string;
  status: string;
}

export interface CreateSessionResponse {
  session: {
    id: string;
    hostId: string;
    hostName: string;
    title: string;
    status: string;
    createdAt: string;
  };
  inviteLink: string;
  inviteToken: string;
}

export const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};