import { prisma } from '@repo/db';
import type { UploadSession } from './types';

export class UploadSessionDB {
    
    // create a new upload session
  static async create(data: Omit<UploadSession, 'id' | 'createdAt' | 'updatedAt'>): Promise<UploadSession> {
    const session = await prisma.uploadSession.create({
      data: {
        userId: data.userId,
        recordingId: data.recordingId,
        filename: data.filename,
        mimeType: data.mimeType,
        totalSize: data.totalSize,
        chunkSize: data.chunkSize,
        totalChunks: data.totalChunks,
        uploadedChunks: data.uploadedChunks,
        storageKey: data.storageKey,
        uploadId: data.uploadId,
        status: data.status,
        expiresAt: data.expiresAt,
      },
    });

    return this.mapToSession(session);
  }

 // get upload session by id
  static async getById(sessionId: string): Promise<UploadSession | null> {
    const session = await prisma.uploadSession.findUnique({
      where: { id: sessionId },
    });

    return session ? this.mapToSession(session) : null;
  }

  // update upload session
  static async update(
    sessionId: string,
    data: Partial<UploadSession>
  ): Promise<UploadSession> {
    const session = await prisma.uploadSession.update({
      where: { id: sessionId },
      data: {
        uploadedChunks: data.uploadedChunks,
        status: data.status,
        updatedAt: new Date(),
      },
    });

    return this.mapToSession(session);
  }

  // mark chunk as uploaded
  static async markChunkUploaded(
    sessionId: string,
    chunkIndex: number
  ): Promise<UploadSession> {
    const session = await this.getById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const uploadedChunks = [...session.uploadedChunks, chunkIndex].sort((a, b) => a - b);

    return this.update(sessionId, {
      uploadedChunks,
      status: uploadedChunks.length === session.totalChunks ? 'completed' : 'uploading',
    });
  }

  // check if chunk is already uploaded
  static async isChunkUploaded(sessionId: string, chunkIndex: number): Promise<boolean> {
    const session = await this.getById(sessionId);
    return session ? session.uploadedChunks.includes(chunkIndex) : false;
  }

  // delete expired sessions
  static async cleanupExpired(): Promise<number> {
    const result = await prisma.uploadSession.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
        status: {
          not: 'completed',
        },
      },
    });

    return result.count;
  }

  private static mapToSession(data: any): UploadSession {
    return {
      id: data.id,
      userId: data.userId,
      recordingId: data.recordingId,
      filename: data.filename,
      mimeType: data.mimeType,
      totalSize: data.totalSize,
      chunkSize: data.chunkSize,
      totalChunks: data.totalChunks,
      uploadedChunks: data.uploadedChunks || [],
      storageKey: data.storageKey,
      uploadId: data.uploadId,
      status: data.status,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      expiresAt: data.expiresAt,
    };
  }
}
