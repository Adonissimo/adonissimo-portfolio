import 'server-only';
import { redirect } from 'next/navigation';
import { AppError, authorize, isRole, type Permission, type Role } from './domain';
import { backendConfigured } from './config';
import { serviceDb, userDb } from './db';
import { dbFailure } from './http';

export type Actor = { id: string; role: Role; name: string; sessionId: string; db: Awaited<ReturnType<typeof userDb>> };
export async function startAppSession(db: Awaited<ReturnType<typeof userDb>>) {
  const { data, error } = await db.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub || typeof claims.session_id !== 'string') throw new AppError(401, 'Sign in again to continue.');
  const result = await serviceDb().rpc('establish_app_session', { p_session_id: claims.session_id, p_user_id: claims.sub });
  dbFailure(result.error);
  if (result.data !== true) throw new AppError(401, 'This session has expired. Please sign in again.');
}
export async function requireActor(permission: Permission = 'read', touch = true): Promise<Actor> {
  if (!backendConfigured()) throw new AppError(503, 'Sign-in is not available yet. Please try again later.');
  const db = await userDb();
  const { data, error } = await db.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub || typeof claims.session_id !== 'string') throw new AppError(401, 'Sign in to continue.');
  const { data: eligible, error: sessionError } = await db.rpc('session_eligible');
  dbFailure(sessionError);
  if (eligible !== true) throw new AppError(401, 'Your session expired. Sign in again.');
  const { data: profile, error: profileError } = await db.from('profiles').select('user_id,role,display_name,active').eq('user_id', claims.sub).single();
  dbFailure(profileError);
  if (!profile?.active || !isRole(profile.role)) throw new AppError(403, 'This account is not enabled.');
  authorize(profile.role, permission);
  if (touch) {
    const result = await serviceDb().rpc('touch_app_session', { p_session_id: claims.session_id, p_user_id: claims.sub });
    dbFailure(result.error);
    if (result.data !== true) throw new AppError(401, 'Your session expired. Sign in again.');
  }
  return { id: claims.sub, sessionId: claims.session_id, role: profile.role, name: String(profile.display_name), db };
}
export async function pageActor(permission: Permission = 'read') {
  try { return await requireActor(permission); }
  catch (error) { if (error instanceof AppError && error.status === 401) redirect('/login'); throw error; }
}
