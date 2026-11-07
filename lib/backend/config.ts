import 'server-only';
import { AppError, email } from './domain';

export function backendConfigured(): boolean { return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY); }
export function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new AppError(503, 'This service is not configured yet. Please try again later.');
  return value;
}
export function appOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  const url = new URL(raw);
  if (url.username || url.password || (url.protocol !== 'https:' && !(['localhost','127.0.0.1','[::1]'].includes(url.hostname) && url.protocol === 'http:'))) throw new AppError(503, 'The site address is not configured correctly.');
  return url.origin;
}
export function acceptedOrigins(): Set<string> {
  const origins = new Set([appOrigin()]);
  for (const host of [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]) if (host) origins.add(new URL(`https://${host}`).origin);
  return origins;
}

export function contactConfigured(): boolean {
  if (!backendConfigured()) return false;
  try {
    for (const name of ['SUPABASE_SECRET_KEY','TURNSTILE_SECRET_KEY','NEXT_PUBLIC_TURNSTILE_SITE_KEY','RESEND_API_KEY','RESEND_FROM']) required(name);
    if (required('RATE_LIMIT_SECRET').length < 32) return false;
    email(required('PRIVACY_CONTACT_EMAIL'));
    return true;
  } catch { return false; }
}
