export type RecordingStatus =
  | 'idle'
  | 'requesting-permission'
  | 'initializing'
  | 'recording'
  | 'paused'
  | 'stopping'
  | 'stopped'
  | 'error';

export type RecordingEventType =
  | 'permission-requested'
  | 'permission-granted'
  | 'permission-denied'
  | 'initialized'
  | 'started'
  | 'paused'
  | 'resumed'
  | 'stopped'
  | 'data-available'
  | 'error'
  | 'state-changed';

export interface RecordingEvent<T = unknown> {
  type: RecordingEventType;
  timestamp: number;
  data?: T;
}

export interface RecordingConfig {
  audio: boolean;  //enable audio recording @default true

  video: boolean; //enable video recording @default false

  mimeType?: string;  //mime type for recording (auto-detected if not provided)

  audioBitsPerSecond?: number;  //audio bitrate in bits per second @default 128000

  videoBitsPerSecond?: number;  //video bitrate in bits per second @default 2500000

  timeslice?: number;  //media recorder timeslice in milliseconds (controls how often data is made available) @default 1000

  audioConstraints?: MediaTrackConstraints;  //audio constraints for getUserMedia

  videoConstraints?: MediaTrackConstraints;  //video constraints for getUserMedia

  autoRecover?: boolean;  //enable automatic error recovery @default true
}

export interface RecordingState {
  status: RecordingStatus;
  duration: number;
  dataSize: number;
  error?: RecordingError;
}

export interface RecordingMetadata {
  startTime: number;
  endTime?: number;
  duration: number;
  mimeType: string;
  codec?: string;
  audioTracks: number;
  videoTracks: number;
  dataSize: number;
  metadata: Object;
}

export type RecordingEventCallback = (event: RecordingEvent) => void;

export class RecordingError extends Error {
  constructor(
    message: string,
    public code: RecordingErrorCode,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'RecordingError';
    Object.setPrototypeOf(this, RecordingError.prototype);
  }
}

export type RecordingErrorCode =
  | 'NOT_SUPPORTED'
  | 'PERMISSION_DENIED'
  | 'DEVICE_NOT_FOUND'
  | 'RECORDING_FAILED'
  | 'ALREADY_RECORDING'
  | 'NOT_RECORDING'
  | 'INVALID_STATE'
  | 'MIME_TYPE_NOT_SUPPORTED'
  | 'INITIALIZATION_FAILED'
  | 'STREAM_ENDED'
  | 'UNKNOWN';
