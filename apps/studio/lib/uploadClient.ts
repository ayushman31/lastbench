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
  
    async completeUpload(sessionId: string , userId: string, title:string, duration:number ) {
      const resS3Upload = await fetch(`${this.baseUrl}/api/upload/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
 
      if (!resS3Upload.ok) throw new Error('Failed to complete S3 upload');
      const s3UploadData = await resS3Upload.json();
      console.log('s3UploadData', s3UploadData);

      const trackUrl = s3UploadData.url;
      const recordingUrl = trackUrl.substring(0, trackUrl.lastIndexOf("/")+1); // +1 to include the /

      const resDBTrackRecordingUpload= await fetch(`${this.baseUrl}/api/db`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || 'Untitled Recording',
          duration,
          status: 'uploaded',
          storageUrl: recordingUrl,
          trackUrl: trackUrl,
          trackType: 'video',
          userId: userId,
          projectId: null,
        }),
      });
      console.log('resDBTrackRecordingUpload', resDBTrackRecordingUpload);

      if (!resDBTrackRecordingUpload.ok) throw new Error('Failed to upload track and recording to database');

      const dbTrackRecordingUploadData = await resDBTrackRecordingUpload.json();
  
      
      return {
        s3UploadUrl: s3UploadData,
        dbTrackRecordingUpload: dbTrackRecordingUploadData,
      };
    }
  }
  