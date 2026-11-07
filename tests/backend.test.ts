import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AppError, authorize, permitted, validateEntry, validateContact, normalizeTags, pageQuery, localDestination, password, email } from '../lib/backend/domain.ts';
const draft = { title: 'Real project', slug: 'real-project', description: 'A real portfolio project.', body: '## My project\n\nA real account of the work.', published: false, tags: ['React'], stage: 'built' };
const message = { name: 'Test Person', email: 'sender@example.test', subject: 'Project question', body: 'This is a fictional test message.', consent: true, token: 'challenge-token', submissionId: '12345678-1234-4234-8234-123456789012' };
test('business authorization rejects missing identity and preserves Editor/Viewer boundaries', () => {
  assert.throws(() => authorize(null, 'write'), (error: unknown) => error instanceof AppError && error.status === 401);
  for (const role of ['viewer','editor'] as const) assert.throws(() => authorize(role, 'manage'), (error: unknown) => error instanceof AppError && error.status === 403);
  assert.equal(permitted('viewer','read'),true); assert.equal(permitted('viewer','write'),false);
  assert.equal(permitted('editor','write'),true); assert.equal(permitted('editor','delete'),false); assert.equal(permitted('owner','delete'),true);
});
test('content validation discards injected actor/role fields and validates draft/publication state', () => {
  const entry = validateEntry({ ...draft, created_by: 'attacker', role: 'owner', published: true });
  assert.equal(entry.published, true); assert.equal('created_by' in entry, false); assert.equal('role' in entry, false); assert.equal(entry.id,'');
  assert.throws(() => validateEntry({ ...draft, published: 'true' }));
  assert.throws(() => validateEntry(draft,'12345678-1234-4234-8234-123456789012'));
  const updated_at='2026-10-30T12:00:00.123456+00:00';
  assert.equal(validateEntry({...draft,updated_at},'12345678-1234-4234-8234-123456789012').updated_at,updated_at);
});
test('content rejects unsafe URLs, malformed slugs, oversized text and foreign record identifiers', () => {
  for (const live_url of ['javascript:alert(1)','http://unsafe.test','https://name:secret@example.test']) assert.throws(() => validateEntry({ ...draft, live_url }));
  assert.throws(() => validateEntry({ ...draft, slug: '../admin' }));
  assert.throws(() => validateEntry({ ...draft, body: 'x'.repeat(30001) }));
  assert.throws(() => validateEntry(draft,'not-a-uuid'));
  assert.equal(validateEntry({ ...draft, source_url: 'https://github.com/example/repo' }).source_url,'https://github.com/example/repo');
});
test('contact requires consent, a bounded message, verification and an idempotency identifier', () => {
  assert.equal(validateContact(message).email,'sender@example.test');
  for (const input of [{ ...message, consent: false },{ ...message, token: '' },{ ...message, body: 'x'.repeat(4001) },{ ...message, submissionId: 'invented' }]) assert.throws(() => validateContact(input));
});
test('tags are deduplicated and bounded before database writes', () => {
  assert.deepEqual(normalizeTags(['React','React',' TypeScript ']),['React','TypeScript']);
  assert.throws(() => normalizeTags(Array.from({length:13},(_,i)=>String(i))));
  assert.throws(() => normalizeTags(['x'.repeat(41)]));
});
test('public queries bound pagination and reject invalid or expensive ranges', () => {
  assert.deepEqual(pageQuery(new URLSearchParams()), { page:1,limit:12,query:'',tag:'' });
  for (const input of ['limit=10000','page=-1','page=1.2','page=99999999']) assert.throws(() => pageQuery(new URLSearchParams(input)));
  assert.equal(pageQuery(new URLSearchParams({q:'x'.repeat(500)})).query.length,120);
});
test('auth callback destinations cannot become open redirects', () => {
  assert.equal(localDestination('/reset-password'),'/reset-password');
  for (const value of ['https://evil.test','//evil.test','/admin?role=owner','/\\evil.test',null]) assert.equal(localDestination(value),'/admin');
});
test('password validation preserves significant spaces and email validation blocks header injection', () => {
  assert.equal(password('  twelve-characters  '),'  twelve-characters  ');
  assert.throws(() => password('too-short'));
  assert.equal(email('  NAME@example.test  '),'name@example.test');
  for(const invalid of ['user@example.test\r\nBcc:other@example.test','user@example.test?bcc=other@example.test','user@example.test%0a','user@-invalid.test']) assert.throws(() => email(invalid));
});
