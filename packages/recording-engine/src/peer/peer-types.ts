import type { RecordingErrorCode } from '../core/types';

export type PeerConnectionState = 
  | 'new'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'failed'
  | 'closed';

export type SignalingState =
  | 'stable'
  | 'have-local-offer'
  | 'have-remote-offer'
  | 'have-local-pranswer'
  | 'have-remote-pranswer'
  | 'closed';

export interface PeerConfig {
    // ice servers for nat traversal
  iceServers: RTCIceServer[];

  // enable data channel for messaging
  dataChannel?: boolean;

  // audio constraints for remote peer
  audioConstraints?: MediaTrackConstraints;

  // video constraints for remote peer
  videoConstraints?: MediaTrackConstraints;
}

export interface RemotePeer {
  id: string;
  userId: string;
  userName?: string;
  connection: RTCPeerConnection;
  stream: MediaStream | null;
  dataChannel: RTCDataChannel | null;
  connectionState: PeerConnectionState;
  signalingState: SignalingState;
  audioTrack: MediaStreamTrack | null;
  videoTrack: MediaStreamTrack | null;
  connected: boolean;
  joinedAt: Date;
  stats?: PeerStats;
}

export interface PeerStats {
  bytesReceived: number;
  bytesSent: number;
  packetsLost: number;
  audioLevel: number;
  videoFrameRate: number;
  roundTripTime: number;
  jitter: number;
}

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'peer-joined' | 'peer-left';
  from: string;
  to?: string;
  data: any;
  timestamp: number;
}

export interface SessionInfo {
  sessionId: string;
  hostId: string;
  hostName?: string;
  participants: string[];
  maxParticipants?: number;
  createdAt: Date;
}

export type PeerEventType =
  | 'peer-connecting'
  | 'peer-connected'
  | 'peer-disconnected'
  | 'peer-failed'
  | 'stream-added'
  | 'stream-removed'
  | 'data-channel-message'
  | 'ice-candidate'
  | 'connection-state-changed'
  | 'stats-updated';

export interface PeerEvent {
  type: PeerEventType;
  peerId: string;
  data?: any;
  timestamp: number;
}

export type PeerEventCallback = (event: PeerEvent) => void;

export class PeerConnectionError extends Error {
  constructor(
    message: string,
    public code: PeerErrorCode,
    public peerId?: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'PeerConnectionError';
    Object.setPrototypeOf(this, PeerConnectionError.prototype);
  }
}

export type PeerErrorCode =
  | RecordingErrorCode
  | 'CONNECTION_FAILED'
  | 'SIGNALING_FAILED'
  | 'ICE_FAILED'
  | 'STREAM_UNAVAILABLE'
  | 'DATA_CHANNEL_FAILED'
  | 'TIMEOUT'
  | 'INVALID_STATE';

  