import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { appOrigin, required } from './config';

const authOptions = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false };
export function publicDb() {
  return createClient(required('NEXT_PUBLIC_SUPABASE_URL'), required('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'), { auth: authOptions, global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store', signal: AbortSignal.timeout(10000) }) } });
}
// Privileged client only for bootstrap, session bookkeeping, contact/outbox and validated media storage.
// Ordinary CMS reads/writes must use userDb() and its RLS-scoped token.
export function serviceDb() {
  return createClient(required('NEXT_PUBLIC_SUPABASE_URL'), required('SUPABASE_SECRET_KEY'), { auth: authOptions, global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store', signal: AbortSignal.timeout(15000) }) } });
}
export async function userDb(writable = false) {
  const jar = await cookies();
  return createServerClient(required('NEXT_PUBLIC_SUPABASE_URL'), required('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'), {
    cookieOptions: { httpOnly: true, sameSite: 'lax', secure: appOrigin().startsWith('https://'), path: '/' },
    cookies: {
      getAll: () => jar.getAll(),
      setAll: values => {
        if (writable) for (const { name, value, options } of values) jar.set(name, value, { ...options, httpOnly: true, sameSite: 'lax', secure: appOrigin().startsWith('https://'), path: '/' });
        // Server Components are read-only; proxy.ts persists refreshed cookies.
      }
    },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store', signal: AbortSignal.timeout(10000) }) }
  });
}
