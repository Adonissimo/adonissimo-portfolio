import { cookies } from 'next/headers';
import { AppError, email, password, text } from '@/lib/backend/domain';
import { appOrigin } from '@/lib/backend/config';
import { serviceDb, userDb } from '@/lib/backend/db';
import { requireActor, startAppSession } from '@/lib/backend/auth';
import { bodyJson, dbFailure, json, rateLimit, route, sameOrigin } from '@/lib/backend/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ action: string }> };
export async function POST(request: Request, context: Context) {
  const { action } = await context.params;
  return route(async req => {
    sameOrigin(req);
    const db = await userDb(true);
    if (action === 'logout') {
      const { data } = await db.auth.getClaims();
      let revoked = true;
      if (data?.claims?.sub && typeof data.claims.session_id === 'string') {
        const result = await serviceDb().rpc('revoke_app_session', { p_session_id: data.claims.session_id, p_user_id: data.claims.sub });
        revoked = !result.error;
      }
      await db.auth.signOut({ scope: 'local' });
      const jar = await cookies();
      for (const cookie of jar.getAll()) if (/^sb-.+-auth-token(?:\.\d+)?$/.test(cookie.name)) jar.delete(cookie.name);
      if (!revoked) throw new AppError(503, 'This browser signed out, but session revocation could not be confirmed. Please retry later.');
      return json({ ok: true });
    }
    await rateLimit(req, 'auth-total', 60, 600);
    const input = await bodyJson(req);
    if (action === 'oauth') {
      if (input.provider !== 'github' && input.provider !== 'google') throw new AppError(422, 'Choose a supported sign-in provider.');
      const { data, error } = await db.auth.signInWithOAuth({ provider: input.provider, options: { redirectTo: `${appOrigin()}/auth/callback`, skipBrowserRedirect: true } });
      if (error || !data.url) throw new AppError(503, 'This sign-in provider is unavailable. Try email sign-in.');
      return json({ url: data.url });
    }
    if (action === 'reset-password') {
      await requireActor('read');
      const { error } = await db.auth.updateUser({ password: password(input.password) });
      if (error) throw new AppError(422, 'The password could not be updated. Request a fresh recovery link and try again.');
      const { data } = await db.auth.getClaims();
      if (data?.claims?.sub && typeof data.claims.session_id === 'string') {
        const result = await serviceDb().rpc('revoke_app_session', { p_session_id: data.claims.session_id, p_user_id: data.claims.sub });
        dbFailure(result.error);
      }
      await db.auth.signOut({ scope: 'local' });
      return json({ ok: true, message: 'Password updated. Sign in with your new password.' });
    }
    if (!['login','signup','forgot-password'].includes(action)) throw new AppError(404, 'Unknown authentication action.');
    const address = email(input.email);
    await rateLimit(req, `auth-${action}-account`, 8, 900, address);
    if (action === 'forgot-password') {
      // An identical response prevents account enumeration.
      const { error } = await db.auth.resetPasswordForEmail(address, { redirectTo: `${appOrigin()}/auth/callback?next=/reset-password` });
      if (error?.status && error.status >= 500) throw new AppError(503, 'Recovery email is temporarily unavailable. Please try again.');
      if (error?.status === 429) throw new AppError(429, 'Too many recovery attempts. Please wait and try again.');
      if (error) console.error('password_recovery_delivery_unavailable');
      return json({ message: 'If this request can be processed for an account, a recovery link will arrive shortly.' }, 202);
    }
    if (action === 'signup') {
      const { error } = await db.auth.signUp({ email: address, password: password(input.password), options: { data: { display_name: text(input.name, 'name', 2, 80) }, emailRedirectTo: `${appOrigin()}/auth/callback` } });
      if (error) throw new AppError(422, 'Registration could not complete. Check your details or try signing in.');
      // The DB trigger always assigns Viewer; request metadata cannot grant a role.
      return json({ message: 'Check your email to confirm your account before signing in.' }, 202);
    }
    if (typeof input.password !== 'string' || !input.password.length || input.password.length > 128) throw new AppError(422, 'Enter your password.');
    const { error } = await db.auth.signInWithPassword({ email: address, password: input.password });
    if (error) throw new AppError(401, 'Sign-in failed. Check your email, password and email confirmation.');
    await startAppSession(db);
    return json({ redirect: '/admin' });
  })(request);
}
export async function GET(request: Request) {
  return route(async () => { throw new AppError(405, 'Use POST for authentication.'); })(request);
}
