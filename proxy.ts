import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  let response = NextResponse.next({ request });
  if (!url || !key) return response;
  const secure = process.env.NODE_ENV === 'production' && !['localhost','127.0.0.1','[::1]'].includes(request.nextUrl.hostname);
  const db = createServerClient(url, key, {
    cookieOptions: { httpOnly: true, sameSite: 'lax', secure, path: '/' },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: values => {
        for (const { name, value } of values) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of values) response.cookies.set(name, value, { ...options, httpOnly: true, sameSite: 'lax', secure, path: '/' });
      }
    }
  });
  const { data, error } = await db.auth.getClaims();
  if (request.nextUrl.pathname.startsWith('/admin') && (error || !data?.claims?.sub)) {
    const redirect = NextResponse.redirect(new URL('/login', request.url));
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    redirect.headers.set('Cache-Control', 'private, no-store'); return redirect;
  }
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
// Public content never receives refreshed user cookies or private cached output.
export const config = { matcher: ['/admin/:path*', '/api/admin/:path*', '/api/auth/:path*', '/api/session/:path*', '/reset-password'] };
