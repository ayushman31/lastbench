import { prisma } from '@repo/db';
import type { UploadRecording, UploadRecordingRequest } from './types';

export class RecordingDB {
    static async create(data: Omit<UploadRecordingRequest, 'id' | 'createdAt'>): Promise<UploadRecording> {
        const recording = await prisma.recording.create({
            data: {
                projectId: data.projectId,
                title: data.title,
                duration: data.duration,
                status: data.status,
                storageUrl: data.storageUrl,
            },
        });
        return this.mapToRecording(recording);
    }

    static async getById(id: string): Promise<UploadRecording | null> {
        const recording = await prisma.recording.findUnique({
            where: { id },
            include: {
                tracks: true,
            },
        });
        return recording ? this.mapToRecording(recording) : null;
    }

    static async getByProjectId(projectId: string): Promise<UploadRecording[] | null> {
        const recordings = await prisma.recording.findMany({
            where: { projectId },
        });
        return recordings.map(this.mapToRecording);
    }

    static async getByUserId(userId: string): Promise<UploadRecording[] | null> {
        const recordings = await prisma.recording.findMany({
            where: {
              tracks: {
                some: {
                  userId: userId,
                },
              },
            },
            include: {
              tracks: true,
            },
          });
        return recordings.map(this.mapToRecording);
    }

    static async delete(id: string): Promise<void> {
        await prisma.recording.delete({
            where: { id },
        });
    }

    static async update(id: string, data: Partial<UploadRecording>): Promise<UploadRecording> {
        const recording = await prisma.recording.update({
            where: { id },
            data: {
                projectId: data.projectId,
                title: data.title,
                duration: data.duration,
                status: data.status,
                storageUrl: data.storageUrl,
            },
        });
        return this.mapToRecording(recording);
    }

    

    private static mapToRecording(data: any): UploadRecording {
        return {
            id: data.id,
            projectId: data.projectId,
            title: data.title,
            duration: data.duration,
            status: data.status,
            storageUrl: data.storageUrl,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            tracks: data.tracks,
        };
    }
}
