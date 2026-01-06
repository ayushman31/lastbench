export { LocalRecorder } from './LocalRecorder';

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
} from './types';
