// recording session management with guest invitations

import { prisma } from '@repo/db';
import { randomBytes } from 'crypto';
import type { CreateSessionInput, JoinAsGuestInput } from './types.js';


export class SessionService {

  static async createSession(input: CreateSessionInput) {
    const inviteToken = this.generateInviteToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (input.expiresInHours || 6));

    const session = await prisma.recordingSession.create({
      data: {
        hostId: input.hostId,
        hostName: input.hostName,
        title: input.title,
        description: input.description,
        inviteToken,
        maxGuests: input.maxGuests || 5,
        expiresAt,
        status: 'waiting',
      },
    });

    const inviteLink = this.generateInviteLink(inviteToken);

    return {
      session,
      inviteLink,
      inviteToken,
    };
  }

  static async getSessionByToken(inviteToken: string) {
    const session = await prisma.recordingSession.findUnique({
      where: { inviteToken },
      include: {
        guests: {
          where: {
            status: { in: ['invited', 'joined'] },
          },
        },
      },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.expiresAt < new Date()) {
      throw new Error('Session expired');
    }

    if (session.status === 'cancelled') {
      throw new Error('Session cancelled');
    }

    return session;
  }

  static async getSessionById(sessionId: string) {
    return prisma.recordingSession.findUnique({
      where: { id: sessionId },
      include: {
        guests: true,
      },
    });
  }

  // guest joins session using invite token
  static async joinAsGuest(input: JoinAsGuestInput) {
    const session = await this.getSessionByToken(input.inviteToken);

    const activeGuests = session.guests.filter(
      (g) => g.status === 'joined'
    ).length;

    if (activeGuests >= session.maxGuests) {
      throw new Error('Session is full');
    }

    const guest = await prisma.recordingGuest.create({
      data: {
        sessionId: session.id,
        guestName: input.guestName,
        guestEmail: input.guestEmail,
        clientId: input.clientId,
        status: 'joined',
        joinedAt: new Date(),
      },
    });

    return {
      session,
      guest,
    };
  }

  static async updateSessionStatus(sessionId: string, status: string) {
    return prisma.recordingSession.update({
      where: { id: sessionId },
      data: { status },
    });
  }

  static async guestLeft(clientId: string) {
    return prisma.recordingGuest.updateMany({
      where: { clientId },
      data: {
        status: 'left',
        leftAt: new Date(),
      },
    });
  }

  static async getActiveGuests(sessionId: string) {
    return prisma.recordingGuest.findMany({
      where: {
        sessionId,
        status: 'joined',
      },
    });
  }

  static async kickGuest(guestId: string) {
    return prisma.recordingGuest.update({
      where: { id: guestId },
      data: {
        status: 'kicked',
        leftAt: new Date(),
      },
    });
  }

  private static generateInviteToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private static generateInviteLink(token: string): string {
    const baseUrl = process.env.STUDIO_URL || 'http://localhost:3001';
    return `${baseUrl}/join/${token}`;
  }
}
