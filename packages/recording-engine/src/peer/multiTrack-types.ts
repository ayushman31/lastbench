export interface TrackRecordingConfig {
    quality?: 'low' | 'medium' | 'high' | 'custom';
    audioBitsPerSecond?: number;
    videoBitsPerSecond?: number;
    timeslice?: number;
    mimeType?: string;
  }
  
  export interface ParticipantTrack {
    participantId: string;
    participantName?: string;
    trackId: string;
    type: 'audio' | 'video';
    track: MediaStreamTrack;
    recorder: MediaRecorder | null;
    chunks: Blob[];
    size: number;
    startTime: number;
    endTime?: number;
    duration: number;
    status: 'idle' | 'recording' | 'paused' | 'stopped' | 'error';
    error?: Error;
  }
  
  export interface RecordingSession {
    sessionId: string;
    hostTrack?: ParticipantTrack;
    participantTracks: Map<string, ParticipantTrack[]>; // participantId -> tracks[]
    startTime: number;
    endTime?: number;
    status: 'idle' | 'recording' | 'paused' | 'stopped';
  }
  
  export type MultiTrackEventType =
    | 'session-started'
    | 'session-stopped'
    | 'track-started'
    | 'track-stopped'
    | 'track-data-available'
    | 'track-error'
    | 'participant-added'
    | 'participant-removed';
  
  export interface MultiTrackEvent {
    type: MultiTrackEventType;
    sessionId: string;
    participantId?: string;
    trackId?: string;
    data?: any;
    timestamp: number;
  }
  
  export type MultiTrackEventCallback = (event: MultiTrackEvent) => void;