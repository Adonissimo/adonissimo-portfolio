import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contactEvidence, createApiClient, runApiChecks, siteOrigin, type RequestApi } from '../scripts/checkpoint-core.ts';

const ownerId = '11111111-1111-4111-8111-111111111111';
const viewerId = '22222222-2222-4222-8222-222222222222';
const projectId = '33333333-3333-4333-8333-333333333333';
const auditId = '44444444-4444-4444-8444-444444444444';
const notificationId = '55555555-5555-4555-8555-555555555555';
const runId = '66666666-6666-4666-8666-666666666666';
type Options = { ownerRole?: string; viewerRole?: string; viewerStatus?: number; deleteStatus?: number; missingAudit?: boolean; wrongActor?: boolean; conflict?: boolean; cleanupFailure?: boolean };
function application(options: Options = {}) {
  let saved: Record<string, unknown> | undefined; let edited = false; let creates = 0; let cleanups = 0;
  const request: RequestApi = async (path, method = 'GET', actor, value) => {
    if (path === '/api/session') return { status: actor === 'VIEWER' ? options.viewerStatus ?? 200 : 200, data: { user: { id: actor === 'OWNER' ? ownerId : viewerId, role: actor === 'OWNER' ? options.ownerRole ?? 'owner' : options.viewerRole ?? 'viewer', email: 'PRIVATE_EMAIL_SENTINEL', access_token: 'PRIVATE_TOKEN_SENTINEL' } } };
    if (path === '/api/admin/projects' && method === 'POST') { creates++; saved = { ...(value as Record<string, unknown>), id: projectId, updated_at: '2026-10-31T00:00:00Z' }; return { status: 201, data: { item: saved } }; }
    if (path.startsWith('/api/admin/projects?')) return { status: 200, data: { items: saved ? [saved] : [] } };
    if (path === `/api/admin/projects/${projectId}` && method === 'DELETE') {
      if (actor === 'VIEWER') { if (options.deleteStatus === 200) saved = undefined; return { status: options.deleteStatus ?? 403, data: {} }; }
      cleanups++; if (options.cleanupFailure) return { status: 503, data: {} }; const exists = Boolean(saved); saved = undefined; return { status: exists ? 200 : 404, data: {} };
    }
    if (path === `/api/admin/projects/${projectId}` && method === 'PATCH') {
      if (options.conflict) return { status: 409, data: {} };
      assert.equal((value as Record<string, unknown>).updated_at, saved?.updated_at);
      saved = { ...saved, ...(value as Record<string, unknown>), updated_at: '2026-10-31T00:00:01Z' }; edited = true; return { status: 200, data: { item: saved } };
    }
    if (path === '/api/admin/audit') return { status: 200, data: { items: edited && !options.missingAudit ? [{ id: auditId, entity: 'projects', entity_id: projectId, action: 'update', actor_kind: 'user', actor_id: options.wrongActor ? viewerId : ownerId }] : [] } };
    throw new Error('Unexpected fixture request');
  };
  return { request, creates: () => creates, cleanups: () => cleanups };
}

test('checkpoint only accepts an HTTPS site origin or explicit local HTTP development origin', () => {
  assert.equal(siteOrigin('https://portfolio.example.test/'), 'https://portfolio.example.test');
  assert.equal(siteOrigin('http://localhost:3000'), 'http://localhost:3000');
  for (const invalid of ['http://public.example.test', 'https://user:secret@portfolio.example.test', 'https://portfolio.example.test/login', 'https://portfolio.example.test?key=secret', 'javascript:alert(1)']) assert.throws(() => siteOrigin(invalid));
});

test('checkpoint HTTP client isolates Owner/Viewer cookies, accepts rotation, and never follows redirects', async () => {
  const calls: { url: string; cookie: string; redirect: RequestRedirect | undefined }[] = [];
  const client = createApiClient('https://portfolio.example.test', async (url, init) => {
    const cookie = new Headers(init.headers).get('cookie') ?? '';
    calls.push({ url, cookie, redirect: init.redirect });
    const headers = new Headers();
    if (url.endsWith('/owner-login')) headers.append('Set-Cookie', 'session=OWNER_PRIVATE; Path=/; HttpOnly');
    if (url.endsWith('/viewer-login')) headers.append('Set-Cookie', 'session=VIEWER_PRIVATE; Path=/; HttpOnly');
    if (url.endsWith('/refresh')) headers.append('Set-Cookie', 'session=ROTATED_PRIVATE; Path=/; HttpOnly');
    if (url.endsWith('/logout')) headers.append('Set-Cookie', 'session=; Path=/; Max-Age=0');
    if (url.endsWith('/redirect')) return new Response(null, { status: 302, headers: { Location: 'https://outside.example.test' } });
    return Response.json({}, { headers });
  });
  await client.request('/owner-login', 'POST', 'OWNER', {});
  await client.request('/viewer-login', 'POST', 'VIEWER', {});
  await client.request('/read', 'GET', 'OWNER'); assert.equal(calls.at(-1)?.cookie, 'session=OWNER_PRIVATE');
  await client.request('/read', 'GET', 'VIEWER'); assert.equal(calls.at(-1)?.cookie, 'session=VIEWER_PRIVATE');
  await client.request('/refresh', 'GET', 'OWNER');
  await client.request('/read', 'GET', 'OWNER'); assert.equal(calls.at(-1)?.cookie, 'session=ROTATED_PRIVATE');
  await client.request('/logout', 'POST', 'OWNER', {});
  await client.request('/read', 'GET', 'OWNER'); assert.equal(calls.at(-1)?.cookie, '');
  const previous = calls.length; const redirect = await client.request('/redirect', 'GET', 'VIEWER');
  assert.equal(redirect.status, 302); assert.equal(calls.length, previous + 1);
  assert.ok(calls.every(call => call.redirect === 'manual' && new URL(call.url).origin === 'https://portfolio.example.test'));
  for (const path of ['//outside.example.test', '/\\outside.example.test', 'https://outside.example.test']) await assert.rejects(client.request(path, 'GET', 'OWNER'));
});

test('checkpoint proves Viewer 403, fixture preservation and an attributable persisted Owner edit', async () => {
  const app = application(); const result = await runApiChecks(app.request, runId);
  assert.equal(result.rolesVerified, true); assert.equal(result.viewerDeletion.status, 'PASS'); assert.equal(result.viewerDeletion.evidence.httpStatus, 403);
  assert.equal(result.viewerDeletion.evidence.fixtureSurvived, true); assert.equal(result.auditEdit.status, 'PASS'); assert.equal(result.auditEdit.evidence.auditId, auditId);
  assert.equal(result.cleanup.status, 'PASS'); assert.equal(app.cleanups(), 1);
  assert.equal(JSON.stringify(result).includes('PRIVATE_EMAIL_SENTINEL'), false); assert.equal(JSON.stringify(result).includes('PRIVATE_TOKEN_SENTINEL'), false);
});

test('checkpoint refuses to label an Editor or unauthenticated account as the Viewer test', async () => {
  for (const options of [{ viewerRole: 'editor' }, { viewerStatus: 401 }, { ownerRole: 'viewer' }]) {
    const app = application(options); const result = await runApiChecks(app.request, runId);
    assert.equal(result.rolesVerified, false); assert.equal(result.viewerDeletion.status, 'FAIL'); assert.equal(result.auditEdit.status, 'BLOCKED'); assert.equal(app.creates(), 0);
  }
});

test('checkpoint cannot count a 401 or a successful forbidden deletion as a passing 403', async () => {
  for (const deleteStatus of [401, 200]) {
    const app = application({ deleteStatus }); const result = await runApiChecks(app.request, runId);
    assert.equal(result.viewerDeletion.status, 'FAIL'); assert.equal(result.viewerDeletion.evidence.httpStatus, deleteStatus);
    assert.equal(result.auditEdit.status, 'BLOCKED'); assert.equal(app.cleanups(), 1);
  }
});

test('checkpoint requires the edit audit to match this project, update action and authenticated Owner', async () => {
  for (const options of [{ missingAudit: true }, { wrongActor: true }]) {
    const app = application(options); const result = await runApiChecks(app.request, runId);
    assert.equal(result.viewerDeletion.status, 'PASS'); assert.equal(result.auditEdit.status, 'FAIL'); assert.equal(result.auditEdit.reason, 'attributable_edit_audit_missing'); assert.equal(app.cleanups(), 1);
  }
});

test('checkpoint records revision conflicts and failed fixture cleanup instead of hiding either', async () => {
  const conflicted = application({ conflict: true }); const first = await runApiChecks(conflicted.request, runId);
  assert.equal(first.auditEdit.status, 'FAIL'); assert.equal(first.auditEdit.evidence.httpStatus, 409); assert.equal(first.cleanup.status, 'PASS');
  const orphan = application({ cleanupFailure: true }); const second = await runApiChecks(orphan.request, runId);
  assert.equal(second.cleanup.status, 'FAIL'); assert.equal(second.cleanup.evidence.httpStatus, 503);
});

test('contact checkpoint requires inbox/notification evidence and both email/badge observations', () => {
  const complete = { messageId: projectId, notificationId, unreadBefore: 2, unreadAfter: 3, badgeEnabled: true, ownerEmail: true, senderEmail: true, badgeObserved: true };
  assert.equal(contactEvidence(complete).status, 'PASS');
  for (const change of [{ ownerEmail: false }, { senderEmail: false }, { badgeObserved: false }, { badgeEnabled: false }, { messageId: '' }, { notificationId: '' }, { unreadAfter: 2 }, { unreadBefore: NaN }]) assert.equal(contactEvidence({ ...complete, ...change }).status, 'FAIL');
  assert.equal(contactEvidence(complete).evidence.emailVerification, 'operator_observation');
});
