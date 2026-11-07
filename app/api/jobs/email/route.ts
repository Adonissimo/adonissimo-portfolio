import { createHash, timingSafeEqual } from 'node:crypto';
import { required } from '@/lib/backend/config';
import { AppError } from '@/lib/backend/domain';
import { json, route } from '@/lib/backend/http';
import { deliverMailBatch } from '@/lib/backend/mail';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';
const run = route(async request => {
  const secret = required('JOBS_SECRET');
  if (secret.length < 32) throw new AppError(503, 'Job authentication is not configured.');
  const actual = createHash('sha256').update(request.headers.get('authorization') || '').digest();
  const expected = createHash('sha256').update(`Bearer ${secret}`).digest();
  if (!timingSafeEqual(actual, expected)) throw new AppError(401, 'Job authorization required.');
  return json(await deliverMailBatch(3));
});
export const POST = run;
