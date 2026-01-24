export { LocalRecorder } from './core/LocalRecorder';

export {
  detectBrowser,
  getSupportedMimeType,
  checkMediaRecorderSupport,
  type BrowserInfo,
  type BrowserName,
  type BrowserEngine,
} from './utils/browser';

export {
  formatDuration,
  formatBytes,
  blobToBase64,
  blobToArrayBuffer,
  downloadBlob,
  getExtensionFromMimeType,
  extractCodecs,
  validateFileSize,
  generateFilename,
} from './utils/format';

export type {
  RecordingConfig,
  RecordingState,
  RecordingStatus,
  RecordingEvent,
  RecordingEventType,
  RecordingEventCallback,
  RecordingMetadata,
  RecordingError,
  RecordingErrorCode,
} from './core/types';


export { PeerConnectionManager } from './peer/PeerConnectionManager';

export type {
  PeerConfig,
  RemotePeer,
  PeerConnectionState,
  PeerStats,
  SignalingMessage,
  SignalingState,
  SessionInfo,
  PeerEventType,
  PeerEvent,
  PeerEventCallback,
  PeerConnectionError,
  PeerErrorCode,
} from './peer/peer-types';


export { MultiTrackRecorder } from './peer/MultiTrackRecorder';
export type {
  TrackRecordingConfig,
  ParticipantTrack,
  RecordingSession,
  MultiTrackEventType,
  MultiTrackEvent,
  MultiTrackEventCallback,
} from './peer/multiTrack-types';