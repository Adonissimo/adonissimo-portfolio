import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEnv } from 'node:util';
import { applicationSecrets, checkKey, mergeEnvironment, ownerAddress, projectAddress } from '../scripts/setup-config.ts';

test('setup validates the exact project host before using its reference as a CLI argument', () => {
  assert.deepEqual(projectAddress('https://abcdefghijklmnopqrst.supabase.co'), { url: 'https://abcdefghijklmnopqrst.supabase.co', ref: 'abcdefghijklmnopqrst' });
  for (const input of ['https://evil.test','https://abcdefghijklmnopqrst.supabase.co.evil.test','https://user:pass@abcdefghijklmnopqrst.supabase.co','https://abcdefghijklmnopqrst.supabase.co/?key=secret','http://abcdefghijklmnopqrst.supabase.co','https://abcdefghijklmnopqrst.supabase.co/;echo']) assert.throws(() => projectAddress(input));
});
test('setup distinguishes public and private keys without putting values in errors', () => {
  const key = 'sb_secret_abcdefghijklmnopqrstuv'; assert.equal(checkKey(key,'secret'),key);
  assert.throws(() => checkKey(key,'publishable'), error => error instanceof Error && !error.message.includes(key));
  assert.throws(() => checkKey('sb_secret_bad\nINJECTED=yes','secret'));
  assert.equal(ownerAddress(' Owner@example.test '),'owner@example.test');
});
test('setup preserves existing private settings and comments while updating duplicate selected keys', () => {
  const source = '# Keep this note\r\nRESEND_API_KEY="fake-existing-mail-key"\r\nNEXT_PUBLIC_SUPABASE_URL=old\r\nNEXT_PUBLIC_SUPABASE_URL=duplicate\r\nOWNER_BOOTSTRAP_PASSWORD="old-private-password"\r\n';
  const result = mergeEnvironment(source, { NEXT_PUBLIC_SUPABASE_URL: 'https://abcdefghijklmnopqrst.supabase.co', OWNER_BOOTSTRAP_PASSWORD: undefined });
  assert.ok(result.includes('# Keep this note\r\n')); assert.equal(parseEnv(result).RESEND_API_KEY,'fake-existing-mail-key');
  assert.equal((result.match(/NEXT_PUBLIC_SUPABASE_URL=/g) ?? []).length,1);
  assert.equal(parseEnv(result).OWNER_BOOTSTRAP_PASSWORD,undefined); assert.ok(!result.includes('old-private-password'));
  assert.throws(() => mergeEnvironment(source, { JOBS_SECRET:'bad\nOTHER=bad' }));
});
test('setup generates independent app secrets and preserves strong existing values', () => {
  const created=applicationSecrets({}); assert.equal(created.RATE_LIMIT_SECRET.length,64); assert.notEqual(created.RATE_LIMIT_SECRET,created.JOBS_SECRET);
  assert.deepEqual(applicationSecrets(created),created);
  const repaired=applicationSecrets({RATE_LIMIT_SECRET:'x'.repeat(40),JOBS_SECRET:'x'.repeat(40)}); assert.equal(repaired.RATE_LIMIT_SECRET,'x'.repeat(40)); assert.notEqual(repaired.JOBS_SECRET,repaired.RATE_LIMIT_SECRET);
});
