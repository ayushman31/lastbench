import { parse as parseCookie } from 'cookie';
import type { IncomingMessage } from 'http';
import {SessionService} from './SessionService.js';

interface SessionData {
  userId: string;
  email: string;
  name: string | null;
  sessionId: string;
  expiresAt: Date;
  isGuest: false;
}

interface GuestSessionData {
  userId: string; // clientid for guests
  email: null;
  name: string | null;
  sessionId: string;
  expiresAt: Date;
  isGuest: true;
  inviteToken: string;
}
export type AuthData = SessionData | GuestSessionData;

export async function verifySession(
  request: IncomingMessage
): Promise<AuthData | null> {
  // First, try authenticated user session
  const userSession = await verifyUserSession(request);
  if (userSession) {
    return userSession;
  }

  // If no user session, check for guest token in URL
  const guestSession = await verifyGuestSession(request);
  if (guestSession) {
    return guestSession;
  }

  return null;
}


export async function verifyUserSession(
  request: IncomingMessage
): Promise<SessionData | null> {
  try {
    const cookies = parseCookie(request.headers.cookie || '');
    
    // better-auth stores session in cookie with your prefix
    const sessionToken = 
      cookies['lastbench.session_token'] || 
      cookies['lastbench_session_token'];

    if (!sessionToken) {
      console.warn('No session token found in cookies');
      return null;
    }

    // call your auth service to verify session
    const authUrl = process.env.BETTER_AUTH_URL || 'http://localhost:4000';
    const response = await fetch(`${authUrl}/api/auth/get-session`, {
      headers: {
        Cookie: `lastbench.session_token=${sessionToken}`,
      },
    });

    if (!response.ok) {
      console.warn('Session verification failed:', response.status);
      return null;
    }

    const data = await response.json();

    if (!data || !data.user) {
      return null;
    }

    // extract session data
    return {
      userId: data.user.id,
      email: data.user.email,
      name: data.user.name,
      sessionId: data.session.id,
      expiresAt: new Date(data.session.expiresAt),
      isGuest: false,
    };
  } catch (error) {
    console.error('Error verifying session:', error);
    return null;
  }
}
// alternative: verify using session token directly (faster, no HTTP call) requires access to the database
export async function verifySessionLocal(
  request: IncomingMessage
): Promise<SessionData | null> {
  try {
    const cookies = parseCookie(request.headers.cookie || '');
    const sessionToken = 
      cookies['lastbench.session_token'] || 
      cookies['lastbench_session_token'];

    if (!sessionToken) {
      return null;
    }

    // import auth instance (requires adding auth as dependency)
    const { auth } = await import('@repo/auth/server');
    
    // use better-auth's built-in session verification
    const session = await auth.api.getSession({
      headers: {
        cookie: `lastbench.session_token=${sessionToken}`,
      },
    });

    if (!session) {
      return null;
    }

    return {
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
      sessionId: session.session.id,
      expiresAt: new Date(session.session.expiresAt),
      isGuest: false,
    };
  } catch (error) {
    console.error('Error verifying session locally:', error);
    return null;
  }
}


async function verifyGuestSession(
  request: IncomingMessage
): Promise<GuestSessionData | null> {
  try {
    const url = new URL(request.url || '', 'ws://localhost');
    const inviteToken = url.searchParams.get('token');

    if (!inviteToken) {
      return null;
    }

    const session = await SessionService.getSessionByToken(inviteToken);

    if (!session) {
      return null;
    }

    //temporary guest id
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

    return {
      userId: guestId,
      email: null,
      name: null, // will be set when guest provides name
      sessionId: session.id,
      expiresAt: session.expiresAt,
      isGuest: true,
      inviteToken,
    };
  } catch (error) {
    console.error('Error verifying guest session:', error);
    return null;
  }
}