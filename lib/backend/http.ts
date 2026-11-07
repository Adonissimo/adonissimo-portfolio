import 'server-only';
import { randomUUID, createHmac } from 'node:crypto';
import { NextResponse } from 'next/server';
import { AppError, object } from './domain';
import { acceptedOrigins, required } from './config';
import { serviceDb } from './db';

export function json(value: unknown, status = 200) { return NextResponse.json(value, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } }); }
export function sameOrigin(request: Request): void {
  const origin = request.headers.get('origin');
  if (!origin || !acceptedOrigins().has(origin)) throw new AppError(403, 'Refresh this site before submitting the form.');
  const site = request.headers.get('sec-fetch-site');
  if (site === 'cross-site') throw new AppError(403, 'Cross-site requests are not allowed.');
}
export async function readBytes(request: Request, max: number): Promise<ArrayBuffer> {
  if (Number(request.headers.get('content-length') || 0) > max) throw new AppError(413, 'The request is too large.');
  if (!request.body) throw new AppError(400, 'The request body is missing.');
  const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) { const next = await reader.read(); if (next.done) break; size += next.value.byteLength; if (size > max) { await reader.cancel(); throw new AppError(413, 'The request is too large.'); } chunks.push(next.value); }
  } finally { reader.releaseLock(); }
  const result = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.byteLength; }
  return result.buffer;
}
export async function bodyJson(request: Request) {
  if (!(request.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) throw new AppError(415, 'Send JSON data.');
  const bytes = await readBytes(request, 65536);
  try { return object(JSON.parse(new TextDecoder().decode(bytes))); } catch (error) { if (error instanceof AppError) throw error; throw new AppError(400, 'The request is not valid JSON.'); }
}
export function dbFailure(error: { code?: string; message?: string } | null): void {
  if (!error) return;
  if (error.code === '40001') throw new AppError(409, 'This entry changed elsewhere. Reload it before saving. Your current draft has been kept.');
  if (error.code === '23505') throw new AppError(409, 'That slug or record already exists.');
  if (error.code === '42501') throw new AppError(403, 'Your role does not allow this action.');
  if (error.code === 'P0002') throw new AppError(404, 'The record was not found.');
  if (error.code === '23514' || error.code === '22P02' || error.code === '22023') throw new AppError(422, 'Check the supplied fields and try again.');
  if (error.code === 'P0001') throw new AppError(409, 'The change conflicts with an existing record or the last Owner safeguard.');
  throw new AppError(503, 'The data service is temporarily unavailable. Please try again.');
}
export function route(handler: (request: Request, requestId: string) => Promise<Response>) {
  return async (request: Request): Promise<Response> => {
    const requestId = randomUUID();
    try { return await handler(request, requestId); }
    catch (error) {
      if (error instanceof AppError) return json({ error: error.message, fields: error.fields, requestId }, error.status);
      console.error('backend_request_failed', { requestId, type: error instanceof Error ? error.name : 'UnknownError' });
      return json({ error: 'Something went wrong. Please try again.', requestId }, 500);
    }
  };
}
export function requestIdentity(request: Request): string {
  // Vercel overwrites this header. Outside Vercel use a shared conservative bucket,
  // rather than trusting arbitrary client-supplied forwarding headers.
  return process.env.VERCEL === '1' ? request.headers.get('x-vercel-forwarded-for')?.split(',')[0].trim() || 'shared' : 'shared';
}
export async function rateLimit(request: Request, scope: string, limit: number, windowSeconds: number, identity?: string) {
  const secret = required('RATE_LIMIT_SECRET');
  if (secret.length < 32) throw new AppError(503, 'Request protection is not configured.');
  const key = createHmac('sha256', secret).update(`${scope}:${identity ?? requestIdentity(request)}`).digest('hex');
  const { data, error } = await serviceDb().rpc('take_rate_limit', { p_key: key, p_limit: limit, p_window_seconds: windowSeconds });
  dbFailure(error);
  if (data !== true) throw new AppError(429, 'Too many attempts. Please wait before trying again.');
}
