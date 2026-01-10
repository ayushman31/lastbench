import { getStorageClient } from '@repo/storage';

export class UploadStorage {
  private static storage = getStorageClient();

  static async initMultipartUpload(
    key: string,
    mimeType: string
  ): Promise<string | undefined> {
    // for now, we'll handle this through the storage client
    // s3 multipart upload initialization can be added if needed (Maybe when we use chunk.stream instead of chunk.buffer ?)
    return undefined;
  }

  // upload a single chunk
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

  // merge all chunks into final file
  static async mergeChunks(
    key: string,
    totalChunks: number,
    mimeType: string
  ): Promise<{ url: string; size: number }> {
    const chunks: Buffer[] = [];
    let totalSize = 0;

    // download all chunks
    for (let i = 0; i < totalChunks; i++) {
      const chunkKey = `${key}.part${i}`;
      const chunkData = await this.storage.download(chunkKey);
      chunks.push(chunkData);
      totalSize += chunkData.length;
    }

    // merge chunks
    const finalBuffer = Buffer.concat(chunks);

    // upload final file
    const result = await this.storage.upload(key, finalBuffer, {
      contentType: mimeType,
    });

    // clean up chunk files
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
  static async abortUpload(key: string, totalChunks: number): Promise<void> {
    await this.cleanupChunks(key, totalChunks);
    
    // try to delete main file if exists
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
