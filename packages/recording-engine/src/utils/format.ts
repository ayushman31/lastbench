// utility functions for formatting and file handling

// format duration in seconds to HH:MM:SS or MM:SS
export function formatDuration(seconds: number): string {

    if (!Number.isFinite(seconds) || seconds < 0) {
        return '00:00';
      }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
  
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  
    return `${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  }
  
  // format bytes to human-readable size
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
      return '0 Bytes';
    }
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const index = Math.min(
      Math.floor(Math.log(bytes) / Math.log(k)),
      sizes.length - 1
    );
    
    const value = bytes / Math.pow(k, index);
    const precision = decimals < 0 ? 0 : decimals;
  
    const formatted = parseFloat(value.toFixed(precision));
  
    return `${formatted} ${sizes[index]}`;
}
  

  // convert Blob to ArrayBuffer (already a function exists)
//   export async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader();
//       reader.onloadend = () => resolve(reader.result as ArrayBuffer);
//       reader.onerror = () => reject(new Error('Failed to read blob'));
//       reader.readAsArrayBuffer(blob);
//     });
//   }

export async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {  // we'll use this for now, in case we need support for older browsers we'll use the above one
    if (!(blob instanceof Blob)) {
      throw new TypeError('Invalid Blob');
    }
    return blob.arrayBuffer();
  }
  
// convert Blob to base64 string
// export async function blobToBase64(blob: Blob): Promise<string> {  //this one is old but stable, in case the below one fails we'll use this one
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader();
//       reader.onloadend = () => resolve(reader.result as string);
//       reader.onerror = () => reject(new Error('Failed to read blob'));
//       reader.readAsDataURL(blob);
//     });
//   }
export async function blobToBase64(blob: Blob): Promise<string> {
  if (!(blob instanceof Blob)) {
    throw new TypeError('Invalid Blob');
  }
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // convert bytes to a binary string in chunks to avoid memory issues
  let binary = '';
  const chunkSize = 0x8000; // 32KB chunks
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }

  // encode binary string to Base64
  const base64 = btoa(binary);

  // Return with MIME type prefix
  return `data:${blob.type};base64,${base64}`;
}
  

// download blob as file
export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof document === 'undefined') {
    throw new Error('DOM not available');
  }

  const url = URL.createObjectURL(blob);

  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = 'noopener';
    anchor.style.display = 'none';

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } finally {
    // revoke in microtask to avoid premature cancellation
    Promise.resolve().then(() => URL.revokeObjectURL(url));
  }
}
// get file extension from MIME type
export function getExtensionFromMimeType(mimeType: string): string | undefined {
  const mimeToExt: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/ogg': 'ogg',
    'audio/mp4': 'm4a',
    'audio/aac': 'aac',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'video/webm': 'webm',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
  };
  if (!mimeType) {
    console.warn('No MIME type provided, using default "webm"');
    return undefined;
  }

  // handle MIME types with codecs
  const baseType = mimeType.split(';')[0]?.trim().toLowerCase();
  return mimeToExt[baseType ?? ''] || undefined;
}
  
  // extract codec from MIME type string
  export function extractCodecs(mimeType: string): string[] {
    const match = mimeType.match(/codecs=([^;]+)/i);
    return match ? match[1]?.replace(/"/g, '').split(',').map(c => c.trim().toLowerCase()).filter(Boolean) ?? [] : [];
  }
  
  // validate file size against maximum
  export function validateFileSize(
    size: number,
    maxSizeInMB: number
  ): { valid: boolean; message?: string } {
    const maxBytes = maxSizeInMB * 1024 * 1024;
  
    return { valid: size <= maxBytes , message: `File size: ${formatBytes(size)} & Max size: ${formatBytes(maxBytes)}`};
  }
  
  // generate unique filename with timestamp
  export function generateFilename(
    prefix: string = 'recording',
    mimeType?: string
  ): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = crypto.getRandomValues(new Uint32Array(1))[0]?.toString(36) ?? '';
    const safePrefix = prefix.replace(/[^a-z0-9_-]/gi, '_');
  
    const extension = getExtensionFromMimeType(mimeType ?? '') ?? 'webm';
  
    return `${safePrefix}-${timestamp}-${random}.${extension}`;
  }
  
  