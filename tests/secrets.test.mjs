import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { secretRules, scanSecrets } from '../scripts/check-secrets.mjs';

test('secret detection distinguishes public keys from privileged credentials', () => {
  assert.deepEqual(secretRules('sb_publishable_public-site-key'), []);
  assert.ok(secretRules('sb_' + 'secret_' + 'x'.repeat(25)).length);
  const jwt = ['eyJhbGciOiJIUzI1NiJ9', Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url'), 'signature'].join('.');
  assert.ok(secretRules(jwt).includes('privileged Supabase JWT'));
});

test('scanner ignores local env files but detects their secrets in source and browser bundles without echoing values', () => {
  const root = mkdtempSync(join(tmpdir(), 'portfolio-secrets-'));
  try {
    const secret = 'fixture-' + 'private-value-123456';
    writeFileSync(join(root, '.env.local'), `RATE_LIMIT_SECRET=${secret}\n`);
    assert.deepEqual(scanSecrets(root), []);
    mkdirSync(join(root, '.next', 'static'), { recursive: true });
    writeFileSync(join(root, '.next', 'static', 'client.js'), JSON.stringify(secret));
    writeFileSync(join(root, 'leak.txt'), secret);
    const findings = scanSecrets(root);
    assert.equal(findings.length, 2);
    assert.equal(JSON.stringify(findings).includes(secret), false);
    writeFileSync(join(root, '.env.local'), `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${'sb_' + 'secret_' + 'x'.repeat(25)}\n`);
    assert.ok(scanSecrets(root).some(finding => finding.rule === 'private credential configured as public environment variable'));
  } finally { rmSync(root, { recursive: true, force: true }); }
});
