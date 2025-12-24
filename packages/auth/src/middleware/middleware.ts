import { NextResponse } from 'next/server.js';
import type { NextRequest } from 'next/server.d.ts';

export async function middleware(request: NextRequest) {
  // check session with API
  const sessionResponse = await fetch('http://localhost:4000/api/auth/session', {
    headers: {
      cookie: request.headers.get('cookie') || '',
    },
    credentials: 'include',
  });

  if (!sessionResponse.ok) {
    // redirect to web (signup) if not authenticated
    return NextResponse.redirect(new URL('http://localhost:3000/signup'));
  }

  return NextResponse.next();
}

// protect all routes in Studio
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};