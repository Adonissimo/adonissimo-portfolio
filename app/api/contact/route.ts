import { createHash } from 'node:crypto';
import { after } from 'next/server';
import { AppError, validateContact } from '@/lib/backend/domain';
import { serviceDb } from '@/lib/backend/db';
import { bodyJson, dbFailure, json, rateLimit, route, sameOrigin } from '@/lib/backend/http';
import { verifyTurnstile } from '@/lib/backend/turnstile';
import { deliverMailBatch } from '@/lib/backend/mail';
import { contactConfigured } from '@/lib/backend/config';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const POST = route(async request => {
  sameOrigin(request);
  if (!contactConfigured()) throw new AppError(503, 'The message service is not available yet. Please try again later.');
  await rateLimit(request, 'contact-total', 20, 60);
  await rateLimit(request, 'contact-client', 5, 900);
  const input = validateContact(await bodyJson(request));
  const payloadHash = createHash('sha256').update(JSON.stringify([input.name,input.email,input.subject,input.body,input.consent])).digest('hex');
  const db = serviceDb();
  // An acknowledged retry must succeed even when its original challenge was consumed.
  const receipt = await db.rpc('lookup_contact_receipt', { p_submission_id: input.submissionId, p_payload_hash: payloadHash });
  dbFailure(receipt.error);
  if (receipt.data) return json({ ...receipt.data, message: 'Your message was already received.' });
  await verifyTurnstile(input.token);
  const result = await db.rpc('accept_contact', { p_submission_id: input.submissionId, p_payload_hash: payloadHash, p_name: input.name, p_email: input.email, p_subject: input.subject, p_body: input.body });
  dbFailure(result.error);
  after(async () => {
    try { await deliverMailBatch(3); }
    catch { console.error('mail_delivery_deferred'); }
  });
  return json({ ...result.data, message: 'Your message was received. A confirmation email is queued if enabled.' }, 201);
});
