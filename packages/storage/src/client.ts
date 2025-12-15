import {S3Client,PutObjectCommand,GetObjectCommand,DeleteObjectCommand,HeadObjectCommand,ListObjectsV2Command} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getStorageConfig } from './config';
  
  export class StorageClient {
    private s3Client: S3Client;
    private config: ReturnType<typeof getStorageConfig>;
  
    constructor() {
      this.config = getStorageConfig();
      
      this.s3Client = new S3Client({
        region: this.config.region,
        endpoint: this.config.endpoint,
        credentials: {
          accessKeyId: this.config.accessKeyId,
          secretAccessKey: this.config.secretAccessKey,
        },
        forcePathStyle: this.config.forcePathStyle,
      });
    }
  

     // upload a file to storage

    async upload(
      key: string,
      body: Buffer | Uint8Array | string,
      options?: {
        contentType?: string;
        metadata?: Record<string, string>;
      }
    ): Promise<{ key: string; url: string }> {
      const command = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: body,
        ContentType: options?.contentType,
        Metadata: options?.metadata,
      });
  
      await this.s3Client.send(command);
  
      return {
        key,
        url: this.getPublicUrl(key),
      };
    }
  
    // upload a file in chunks (for large files)

    async uploadStream(
      key: string,
      stream: NodeJS.ReadableStream,
      options?: {
        contentType?: string;
        metadata?: Record<string, string>;
      }
    ): Promise<{ key: string; url: string }> {
      const chunks: Buffer[] = [];
      
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
  
      const body = Buffer.concat(chunks);
      return this.upload(key, body, options);
    }
  
    // download a file from storage

    async download(key: string): Promise<Buffer> {
      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });
  
      const response = await this.s3Client.send(command);
      
      if (!response.Body) {
        throw new Error('No body in response');
      }
  
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }
  
      return Buffer.concat(chunks);
    }
  
    // delete a file from storage

    async delete(key: string): Promise<void> {
      const command = new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });
  
      await this.s3Client.send(command);
    }
  
    // check if a file exists

    async exists(key: string): Promise<boolean> {
      try {
        const command = new HeadObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
        });
  
        await this.s3Client.send(command);
        return true;
      } catch (error: any) {
        if (error.name === 'NotFound') {
          return false;
        }
        throw error;
      }
    }
  
    // list files with a prefix

    async list(prefix: string): Promise<string[]> {
      const command = new ListObjectsV2Command({
        Bucket: this.config.bucket,
        Prefix: prefix,
      });
  
      const response = await this.s3Client.send(command);
      return response.Contents?.map((obj) => obj.Key!) || [];
    }
  
    // generate a presigned URL for uploading

    async getPresignedUploadUrl(
      key: string,
      expiresIn: number = 3600,
      contentType?: string
    ): Promise<string> {
      const command = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        ContentType: contentType,
      });
  
      return getSignedUrl(this.s3Client, command, { expiresIn });
    }
  
    // generate a presigned URL for downloading

    async getPresignedDownloadUrl(
      key: string,
      expiresIn: number = 3600
    ): Promise<string> {
      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });
  
      return getSignedUrl(this.s3Client, command, { expiresIn });
    }
  
    // get the public URL of a file (if bucket is public)

    getPublicUrl(key: string): string {
      if (this.config.publicUrl) {
        return `${this.config.publicUrl}/${this.config.bucket}/${key}`;
      }
  
      // Fallback for S3
      if (this.config.provider === 's3') {
        return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
      }
  
      throw new Error('Public URL not configured');
    }
  
    // generate a unique key for a file

    generateKey(userId: string, filename: string, prefix?: string): string {
      const timestamp = Date.now();
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      const parts = [prefix, userId, timestamp, sanitizedFilename].filter(Boolean);
      return parts.join('/');
    }
  }
  
  // singleton instance
  let storageClient: StorageClient | null = null;
  
  export function getStorageClient(): StorageClient {
    if (!storageClient) {
      storageClient = new StorageClient();
    }
    return storageClient;
  }
  