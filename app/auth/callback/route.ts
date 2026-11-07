import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { userDb } from '@/lib/backend/db';
import { startAppSession } from '@/lib/backend/auth';
import { appOrigin } from '@/lib/backend/config';
import { localDestination } from '@/lib/backend/domain';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const reportedCodes = new Set([
  'bad_code_verifier', 'flow_state_not_found', 'flow_state_expired',
  'session_not_found', 'session_expired', 'validation_failed',
  'bad_oauth_callback', 'unexpected_failure', 'request_timeout',
  'over_request_rate_limit', 'over_refresh_token_rate_limit',
  'PGRST202', '42501', '23503'
]);
const reportedNames = new Set([
  'AppError', 'AuthApiError', 'AuthSessionMissingError',
  'AuthPKCECodeVerifierMissingError', 'AuthRetryableFetchError',
  'AuthUnknownError', 'TimeoutError', 'AbortError'
]);

// Never serialize the exception, its message/stack, the request URL or cookies.
// Provider messages and unknown error codes can contain private values.
function diagnostic(error: unknown) {
  const value: { code?: unknown; name?: unknown; status?: unknown } = error && typeof error === 'object'
    ? error as { code?: unknown; name?: unknown; status?: unknown }
    : {};
  return {
    code: typeof value.code === 'string' && reportedCodes.has(value.code) ? value.code : 'unclassified',
    kind: typeof value.name === 'string' && reportedNames.has(value.name) ? value.name : 'UnknownError',
    status: typeof value.status === 'number' && Number.isInteger(value.status) && value.status >= 400 && value.status <= 599 ? value.status : null
  };
}

export async function GET(request: Request) {
  const requestId = randomUUID();
  const headers = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer', 'X-Request-ID': requestId };
  let stage: 'configuration' | 'provider_response' | 'code_exchange' | 'app_session' = 'configuration';
  let origin: string | null = null;
  try {
    origin = appOrigin();
    const db = await userDb(true);
    stage = 'provider_response';
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    if (url.searchParams.has('error') || !code || code.length > 2048) throw new Error('Invalid provider response');
    stage = 'code_exchange';
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (error) throw error;
    stage = 'app_session';
    await startAppSession(db);
    return NextResponse.redirect(new URL(localDestination(url.searchParams.get('next')), origin), { headers });
  } catch (error) {
    console.error('auth_callback_failed', { requestId, stage, ...diagnostic(error) });
    if (!origin) return NextResponse.json({ error: 'Sign-in is temporarily unavailable.', requestId }, { status: 503, headers });
    const destination = new URL('/login?notice=callback', origin);
    destination.searchParams.set('ref', requestId);
    return NextResponse.redirect(destination, { headers });
  }
}
