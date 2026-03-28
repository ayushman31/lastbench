import { prisma } from '@repo/db';
import type { UploadTrack } from './types';

export class TrackDB {
    static async create(data: Omit<UploadTrack, 'id' | 'createdAt'>): Promise<UploadTrack> {
        const track = await prisma.track.create({
            data: {
                recordingId: data.recordingId,
                trackUrl: data.trackUrl,
                trackType: data.trackType,
                userId: data.userId,
            },
        });
        return this.mapToTrack(track);
    }

    static async getById(id: string): Promise<UploadTrack | null> {
        const track = await prisma.track.findUnique({
            where: { id },
        });
        return track ? this.mapToTrack(track) : null;
    }

    static async getByRecordingId(recordingId: string): Promise<UploadTrack[] | null> {
        const tracks = await prisma.track.findMany({
            where: { recordingId },
        });
        return tracks.map(this.mapToTrack);
    }

    static async getByUserId(userId: string): Promise<UploadTrack[] | null> {
        const tracks = await prisma.track.findMany({
            where: { userId },
        });
        return tracks.map(this.mapToTrack);
    }

    static async delete(id: string): Promise<void> {
        await prisma.track.delete({
            where: { id },
        });
    }

    static async update(id: string, data: Partial<UploadTrack>): Promise<UploadTrack> {
        const track = await prisma.track.update({
            where: { id },
            data,
        });
        return this.mapToTrack(track);
    }

    

    private static mapToTrack(data: any): UploadTrack {
        return {
            id: data.id,
            recordingId: data.recordingId,
            trackUrl: data.trackUrl,
            trackType: data.trackType,
            userId: data.userId,
            createdAt: data.createdAt,
        };
    }
}
