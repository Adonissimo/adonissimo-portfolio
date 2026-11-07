import { NextResponse } from 'next/server';
import { userDb } from '@/lib/backend/db';
import { startAppSession } from '@/lib/backend/auth';
import { appOrigin } from '@/lib/backend/config';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const url = new URL(request.url); const token = url.searchParams.get('token_hash'); const type = url.searchParams.get('type');
  const db = await userDb(true);
  try {
    if (!token || token.length > 2048 || (type !== 'email' && type !== 'signup' && type !== 'recovery')) throw new Error('Invalid confirmation');
    const { error } = await db.auth.verifyOtp({ token_hash: token, type });
    if (error) throw new Error('Invalid token');
    await startAppSession(db);
    return NextResponse.redirect(new URL(type === 'recovery' ? '/reset-password' : '/admin', appOrigin()), { headers: { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' } });
  } catch { return NextResponse.redirect(new URL('/login?notice=callback', appOrigin()), { headers: { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' } }); }
}
