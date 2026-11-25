import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { projects, profile } from '../lib/content.ts';

async function targetedSeed({ existing = false, active = true, role = 'owner' } = {}) {
  const writes: Array<{ table: string; value: Record<string, unknown> }> = [];
  let privilegedAccountChanges = 0;
  const db = {
    auth: { admin: {
      listUsers: async () => ({ data: { users: [{ id: 'confirmed-owner', email: 'owner@example.test', email_confirmed_at: '2026-01-01' }] }, error: null }),
      createUser: async () => { privilegedAccountChanges++; throw new Error('Unexpected account creation'); }
    } },
    rpc: async () => { privilegedAccountChanges++; throw new Error('Unexpected role bootstrap'); },
    from(table: string) {
      const query = {
        select() { return query; }, eq() { return query; },
        maybeSingle: async () => ({ data: existing ? { id: 'existing-project' } : null, error: null }),
        single: async () => ({ data: table === 'profiles' ? { role, active } : { id: `${table}-record` }, error: null }),
        insert(value: Record<string, unknown>) { writes.push({ table, value }); return table === 'project_tags' ? Promise.resolve({ error: null }) : query; },
        upsert(value: Record<string, unknown>) { writes.push({ table, value }); return query; }
      };
      return query;
    }
  };
  const code = ts.transpileModule(readFileSync(new URL('../scripts/seed.mjs', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const execute = runInNewContext(`(async () => { ${code} })`, {
    exports: {}, console: { log() {} },
    require: (name: string) => name === 'node:fs' ? { existsSync: () => false } : name === '@supabase/supabase-js' ? { createClient: () => db } : { projects, profile },
    process: { argv: ['node', 'seed.mjs', '--project', 'zeldabonk'], env: { NEXT_PUBLIC_SUPABASE_URL: 'https://example.test', SUPABASE_SECRET_KEY: 'test-only', OWNER_BOOTSTRAP_EMAIL: 'owner@example.test' } }
  }) as () => Promise<void>;
  return { execute, writes, accountChanges: () => privilegedAccountChanges };
}

test('targeted seeding publishes only the selected project without a bootstrap password or role changes', async () => {
  const seed = await targetedSeed(); await seed.execute();
  const records = seed.writes.filter(write => write.table === 'projects');
  assert.equal(records.length, 1); assert.equal(records[0].value.slug, 'zeldabonk');
  assert.equal(records[0].value.live_url, 'https://zelabonk.vercel.app/'); assert.equal(records[0].value.published, true);
  assert.equal(seed.writes.filter(write => write.table === 'project_tags').length, 3); assert.equal(seed.accountChanges(), 0);
});

test('targeted seeding preserves an existing CMS record and its tags', async () => {
  const seed = await targetedSeed({ existing: true }); await seed.execute();
  assert.equal(seed.writes.length, 0); assert.equal(seed.accountChanges(), 0);
});

test('targeted seeding refuses inactive or non-Owner accounts before writing content', async () => {
  for (const options of [{ active: false }, { role: 'editor' }]) {
    const seed = await targetedSeed(options);
    await assert.rejects(seed.execute, /active existing Owner/); assert.equal(seed.writes.length, 0); assert.equal(seed.accountChanges(), 0);
  }
});
