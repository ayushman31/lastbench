export class UploadClient {
    private baseUrl: string;
  
    constructor(baseUrl: string = 'http://localhost:4001') {
      this.baseUrl = baseUrl;
    }
  
    async initUpload(params: {
      userId: string;
      recordingId: string;
      filename: string;
      mimeType: string;
      totalSize: number;
    }) {
      const res = await fetch(`${this.baseUrl}/api/upload/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
  
      if (!res.ok) throw new Error('Failed to init upload');
      return res.json();
    }
  
    async uploadChunk(params: {
      sessionId: string;
      chunkIndex: number;
      chunk: Blob;
      totalChunks: number;
    }) {
      const form = new FormData();
      form.append('chunk', params.chunk);
      form.append('sessionId', params.sessionId);
      form.append('chunkIndex', String(params.chunkIndex));
      form.append('totalChunks', String(params.totalChunks));
  
      const res = await fetch(`${this.baseUrl}/api/upload/chunk`, {
        method: 'POST',
        body: form,
      });
  
      if (!res.ok) throw new Error('Failed to upload chunk');
      return res.json();
    }
  
    async completeUpload(sessionId: string) {
      const res = await fetch(`${this.baseUrl}/api/upload/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
  
      if (!res.ok) throw new Error('Failed to complete upload');
      return res.json();
    }
  }
  