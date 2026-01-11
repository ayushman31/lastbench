import { getStorageClient } from '@repo/storage';
import { 
  S3Client, 
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand 
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';

export class UploadStorage {
  private static storage = getStorageClient();
  private static s3Client : S3Client | null = null;

  //get s3 client
  private static getS3Client(): S3Client {
    if (!this.s3Client) {
      const config = (this.storage as any).config; // most prolly this will give errer becausae config is private
      this.s3Client = new S3Client({
        region: config.region,
        endpoint: config.endpoint,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
        forcePathStyle: config.forcePathStyle,
      });
    }
    return this.s3Client;
  }

  //check if storage supports multipart upload
  static supportsMultipart(): boolean {
    const provider = process.env.STORAGE_PROVIDER as 's3' | 'r2' | 'seaweedfs';
    // s3 and r2 support multipart, seaweedfs may not fully support it
    return provider === 's3' || provider === 'r2';
  }

  // initialize multipart upload
  static async initMultipartUpload(
    key: string,
    mimeType: string
  ): Promise<string | undefined> {
    const s3 = this.getS3Client();
    const bucket = process.env.STORAGE_BUCKET!;

    const command = new CreateMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      ContentType: mimeType,
    });

    const response = await s3.send(command);
    
    if (!response.UploadId) {
      throw new Error('Failed to initialize multipart upload');
    }

    return response.UploadId;
  }

  // upload a chunk using s3 multipart (stream-based)
    static async uploadMultipartChunk(
      key: string,
      uploadId: string,
      partNumber: number,
      stream: Readable,
      size: number
    ): Promise<string> {
      const s3 = this.getS3Client();
      const bucket = process.env.STORAGE_BUCKET!;
  
      // convert stream to buffer for s3 sdk
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
      const body = Buffer.concat(chunks);
  
      const command = new UploadPartCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
        Body: body,
      });
  
      const response = await s3.send(command);
      
      if (!response.ETag) {
        throw new Error('Failed to upload part');
      }
  
      return response.ETag;
    }
  
    // complete s3 multipart upload
    static async completeMultipartUpload(
      key: string,
      uploadId: string,
      parts: Array<{ PartNumber: number; ETag: string }>
    ): Promise<{ url: string }> {
      const s3 = this.getS3Client();
      const bucket = process.env.STORAGE_BUCKET!;
  
      const command = new CompleteMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts.sort((a, b) => a.PartNumber - b.PartNumber),
        },
      });
  
      await s3.send(command);
  
      const url = this.storage.getPublicUrl(key);
      return { url };
    }
  
    // abort s3 multipart upload
    static async abortMultipartUpload(
      key: string,
      uploadId: string
    ): Promise<void> {
      const s3 = this.getS3Client();
      const bucket = process.env.STORAGE_BUCKET!;
  
      const command = new AbortMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
      });
  
      await s3.send(command);
    }

    // upload a chunk using s3 multipart (stream-based)
    static async uploadChunkStream(
      key: string,
      chunkIndex: number,
      stream: Readable,
      mimeType: string
    ): Promise<void> {
      const chunkKey = `${key}.part${chunkIndex}`;
      
      // use aws sdk upload for efficient streaming
      const upload = new Upload({
        client: this.getS3Client(),
        params: {
          Bucket: process.env.STORAGE_BUCKET!,
          Key: chunkKey,
          Body: stream,
          ContentType: mimeType,
        },
      });
  
      await upload.done();
    }

  // upload a single chunk (using buffer)
  static async uploadChunk(
    key: string,
    chunkIndex: number,
    chunkData: Buffer,
    mimeType: string
  ): Promise<void> {
    const chunkKey = `${key}.part${chunkIndex}`;
    await this.storage.upload(chunkKey, chunkData, { contentType: mimeType });
  }

  // check if chunk exists
  static async chunkExists(key: string, chunkIndex: number): Promise<boolean> {
    const chunkKey = `${key}.part${chunkIndex}`;
    return this.storage.exists(chunkKey);
  }

  // merge chunks using streams (memory efficient)
  static async mergeChunksStreaming(
    key: string,
    totalChunks: number,
    mimeType: string
  ): Promise<{ url: string; size: number }> {
    const s3 = this.getS3Client();
    const bucket = process.env.STORAGE_BUCKET!;

    // create a pass-through stream for piping
    const { PassThrough } = await import('stream');
    const passThrough = new PassThrough();

    let totalSize = 0;

    // start upload in background
    const upload = new Upload({
      client: s3,
      params: {
        Bucket: bucket,
        Key: key,
        Body: passThrough,
        ContentType: mimeType,
      },
    });

    const uploadPromise = upload.done();

    // stream chunks sequentially
    (async () => {
      try {
        for (let i = 0; i < totalChunks; i++) {
          const chunkKey = `${key}.part${i}`;
          const chunkData = await this.storage.download(chunkKey);
          totalSize += chunkData.length;
          passThrough.write(chunkData);
        }
        passThrough.end();
      } catch (error) {
        passThrough.destroy(error as Error);
      }
    })();

    await uploadPromise;

    // clean up chunks
    await this.cleanupChunks(key, totalChunks);

    return {
      url: this.storage.getPublicUrl(key),
      size: totalSize,
    };
  }


  // merge all chunks into final file (buffer based)
  static async mergeChunks(
    key: string,
    totalChunks: number,
    mimeType: string
  ): Promise<{ url: string; size: number }> {
    const chunks: Buffer[] = [];
    let totalSize = 0;

    for (let i = 0; i < totalChunks; i++) {
      const chunkKey = `${key}.part${i}`;
      const chunkData = await this.storage.download(chunkKey);
      chunks.push(chunkData);
      totalSize += chunkData.length;
    }

    const finalBuffer = Buffer.concat(chunks);

    const result = await this.storage.upload(key, finalBuffer, {
      contentType: mimeType,
    });

    await this.cleanupChunks(key, totalChunks);

    return {
      url: result.url,
      size: totalSize,
    };
  }

  // delete chunk files
  static async cleanupChunks(key: string, totalChunks: number): Promise<void> {
    const deletePromises = [];

    for (let i = 0; i < totalChunks; i++) {
      const chunkKey = `${key}.part${i}`;
      deletePromises.push(this.storage.delete(chunkKey).catch(() => {}));
    }

    await Promise.all(deletePromises);
  }

  // delete incomplete upload
  static async abortUpload(
    key: string,
    totalChunks: number,
    uploadId?: string
  ): Promise<void> {
    if (uploadId && this.supportsMultipart()) {
      await this.abortMultipartUpload(key, uploadId);
    } else {
      await this.cleanupChunks(key, totalChunks);
    }
    
    try {
      await this.storage.delete(key);
    } catch {}
  }

  // generate storage key for recording
  static generateStorageKey(
    userId: string,
    recordingId: string,
    filename: string
  ): string {
    const timestamp = Date.now();
    const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `recordings/${userId}/${recordingId}/${timestamp}-${sanitized}`;
  }
}
