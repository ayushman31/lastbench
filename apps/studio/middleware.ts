import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {

  const cookieHeader = request.headers.get('cookie');

  // check if session cookie is present
  const hasSessionCookie = cookieHeader?.includes('lastbench.session_token');

  if (!hasSessionCookie) {
    // redirect to web if not authenticated
    return NextResponse.redirect(new URL('http://localhost:3000/signup'));
  }

  try{
  // check session with API
    const sessionResponse = await fetch('http://localhost:4000/api/auth/session', {  // maybe we can also use http://localhost:4000/api/auth/get-session but haven't tried it. this is better auth's built-in session endpoint
      headers: {
        cookie: cookieHeader || '',
      },
      credentials: 'include',
    });
    if (!sessionResponse.ok) {
      const url = new URL('http://localhost:3000/signup');
      // return URL so user can come back after login
      url.searchParams.set('returnTo', request.url);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Error getting session:", error);
    return NextResponse.redirect(new URL('http://localhost:3000/signup'));
  }
}
// protect all routes in studio
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};