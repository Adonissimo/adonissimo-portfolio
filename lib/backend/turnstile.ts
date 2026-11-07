import 'server-only';
import { AppError } from './domain';
import { acceptedOrigins, required } from './config';

export async function verifyTurnstile(token: string): Promise<void> {
  let result: { success?: boolean; hostname?: string; action?: string };
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', signal: AbortSignal.timeout(8000), headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: required('TURNSTILE_SECRET_KEY'), response: token })
    });
    if (!response.ok) throw new Error('Verification unavailable');
    result = await response.json();
  } catch (error) { if (error instanceof AppError) throw error; throw new AppError(503, 'Verification is temporarily unavailable. Please try again.'); }
  const hosts = new Set([...acceptedOrigins()].map(origin => new URL(origin).hostname));
  if (!result.success || !result.hostname || !hosts.has(result.hostname) || result.action !== 'contact') throw new AppError(422, 'Complete a fresh verification challenge before sending.', { verification: 'Complete the verification again.' });
}
