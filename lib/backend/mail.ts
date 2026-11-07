import 'server-only';
import { serviceDb } from './db';
import { required } from './config';
import { dbFailure } from './http';

type MailJob = { id: string; lease_token: string; kind: 'owner_message' | 'sender_confirmation'; recipient_email: string; idempotency_key: string; payload: { name: string; email: string; subject: string; body: string } };
export async function deliverMailBatch(limit = 5) {
  const apiKey = required('RESEND_API_KEY'); const from = required('RESEND_FROM');
  const db = serviceDb();
  const { data, error } = await db.rpc('claim_mail_jobs', { p_limit: limit }); dbFailure(error);
  let sent = 0; let failed = 0;
  for (const job of (data ?? []) as MailJob[]) {
    let providerId: string | null = null; let errorCode = 'provider_unavailable'; let success = false; let permanent = false;
    try {
      const owner = job.kind === 'owner_message';
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST', signal: AbortSignal.timeout(12000),
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': job.idempotency_key },
        body: JSON.stringify({ from, to: [job.recipient_email], ...(owner ? { reply_to: job.payload.email } : {}),
          subject: owner ? `Portfolio letter: ${job.payload.subject}` : 'Your letter reached Adonissimo',
          text: owner ? `${job.payload.name} <${job.payload.email}>\n\n${job.payload.subject}\n\n${job.payload.body}` : `Hello ${job.payload.name},\n\nYour message has been received by Adonissimo. Thank you for getting in touch.\n\nThis is an automatic receipt; no reply time is promised.` })
      });
      const result = await response.json() as { id?: string; name?: string };
      success = response.ok && typeof result.id === 'string'; providerId = result.id ?? null;
      errorCode = `resend_${response.status}`;
      permanent = response.status === 400 || response.status === 401 || response.status === 403 || response.status === 422 || result.name === 'invalid_idempotent_request';
    } catch { /* Keep the durable lease/retry path; never log email payloads or keys. */ }
    const done = await db.rpc('finish_mail_job', { p_id: job.id, p_lease: job.lease_token, p_success: success, p_provider_id: providerId, p_error_code: success ? null : errorCode, p_permanent: permanent });
    dbFailure(done.error);
    if (success) sent++; else failed++;
  }
  return { sent, failed };
}
