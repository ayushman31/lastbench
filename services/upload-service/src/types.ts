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
  