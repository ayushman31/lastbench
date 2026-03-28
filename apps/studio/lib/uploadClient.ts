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
  
    async completeUpload(sessionId: string , userId: string) {
      const resS3Upload = await fetch(`${this.baseUrl}/api/upload/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
 
      if (!resS3Upload.ok) throw new Error('Failed to complete S3 upload');
      const s3UploadData = await resS3Upload.json();
      console.log('s3UploadData', s3UploadData);

      const resDBTrackUpload= await fetch(`${this.baseUrl}/api/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // TODO : this recordingId is a foreign key to the recording table. so we need to generate a unique recordingId and save it to the database
          recordingId: null as null,
          trackUrl: s3UploadData.url,
          trackType: 'video',
          userId: userId,
        }),
      });
      console.log('resDBTrackUpload', resDBTrackUpload);

      if (!resDBTrackUpload.ok) throw new Error('Failed to upload track to database');

      const dbTrackUploadData = await resDBTrackUpload.json();
  
      
      return {
        s3UploadUrl: s3UploadData,
        dbTrackUpload: dbTrackUploadData,
      };
    }
  }
  