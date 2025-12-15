export function getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    
    const mimeTypes: Record<string, string> = {

      // audio
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      m4a: 'audio/mp4',
      aac: 'audio/aac',
      ogg: 'audio/ogg',
      flac: 'audio/flac',
      
      // video
      mp4: 'video/mp4',
      webm: 'video/webm',
      mov: 'video/quicktime',
      avi: 'video/x-msvideo',
      
      // documents (we need this )
      pdf: 'application/pdf',
      json: 'application/json',
      txt: 'text/plain',
    };
  
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }
  
  export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
  
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
  
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
  
  export function validateFileSize(size: number, maxSizeInMB: number): boolean {
    const maxBytes = maxSizeInMB * 1024 * 1024;
    return size <= maxBytes;
  }
  