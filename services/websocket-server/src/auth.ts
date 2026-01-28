import { parse as parseCookie } from 'cookie';
import type { IncomingMessage } from 'http';

interface SessionData {
  userId: string;
  email: string;
  name: string | null;
  sessionId: string;
  expiresAt: Date;
}


export async function verifySession(
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
    };
  } catch (error) {
    console.error('Error verifying session locally:', error);
    return null;
  }
}
