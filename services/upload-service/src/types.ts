export type UploadStatus =
  | 'initializing'
  | 'uploading'
  | 'merging'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface UploadSession {
    id: string;
    userId: string;
    recordingId: string;
    filename: string;
    mimeType: string;
    totalSize: number;
    chunkSize: number;
    totalChunks: number;
    uploadedChunks: number[];
    storageKey: string;
    uploadId?: string; // s3 multipart upload ID
    status: UploadStatus;
    etags?: Record<string, string>; // for storing etags
    createdAt: Date;
    updatedAt: Date;
    expiresAt: Date;
  }
  
  export interface InitUploadRequest {
    userId: string;
    recordingId: string;
    filename: string;
    mimeType: string;
    totalSize: number;
    chunkSize?: number;
  }
  
  export interface InitUploadResponse {
    sessionId: string;
    uploadUrl: string;
    chunkSize: number;
    totalChunks: number;
  }
  
  export interface UploadChunkRequest {
    sessionId: string;
    chunkIndex: number;
    totalChunks: number;
  }
  
  export interface UploadChunkResponse {
    chunkIndex: number;
    uploaded: boolean;
    progress: number;
  }
  
  export interface CompleteUploadRequest {
    sessionId: string;
  }
  
  export interface CompleteUploadResponse {
    url: string;
    storageKey: string;
    size: number;
  }
  
  export interface UploadError extends Error {
    code: string;
    statusCode: number;
  }
  

  // track types
  export interface UploadTrack {
    id: string;
    recordingId: string | null;
    trackUrl: string;
    trackType: string;
    userId: string;
    createdAt: Date;
  }

  export interface UploadTrackRequest {
    recordingId: string | null;
    trackUrl: string;
    trackType: string;
    userId: string;
  }

  // recording types
  export interface UploadRecording {
    id: string;
    projectId: string | null;
    title: string;
    duration: number;
    storageUrl: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    tracks: UploadTrack[];
  }

  export interface UploadRecordingRequest {
    projectId: string | null;
    title: string;
    duration: number;
    status: string;
    storageUrl: string;
  }

  export interface UploadTrackRecordingRequest {
    recordingId: string;
    trackUrl: string;
    trackType: string;
    userId: string;
    projectId: string | null;
    title: string;
    duration: number;
    status: string;
    storageUrl: string;
  }