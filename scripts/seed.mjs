import { existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { projects, profile } from '../lib/content.ts';

if (existsSync('.env.local')) process.loadEnvFile('.env.local');
const required = name => { const value = process.env[name]; if (!value) throw new Error(`Set ${name} in .env.local before seeding.`); return value; };
const url = required('NEXT_PUBLIC_SUPABASE_URL'); const secret = required('SUPABASE_SECRET_KEY');
const email = required('OWNER_BOOTSTRAP_EMAIL').trim().toLowerCase(); const password = required('OWNER_BOOTSTRAP_PASSWORD');
if (password.length < 12 || password.length > 128) throw new Error('Use a unique Owner password of 12–128 characters.');
const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
const fail = error => { if (error) throw new Error(`Seed failed (${error.code || error.status || 'service error'}). Check the private service configuration and migration state.`); };
let owner;
for (let page = 1; page <= 100; page++) {
  const result = await db.auth.admin.listUsers({ page, perPage: 100 }); fail(result.error);
  owner = result.data.users.find(user => user.email?.toLowerCase() === email);
  if (owner || result.data.users.length < 100) break;
}
if (!owner) {
  const result = await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { display_name: profile.displayName } }); fail(result.error); owner = result.data.user;
}
if (!owner) throw new Error('The Owner account could not be created.');
if (!owner.email_confirmed_at) throw new Error('Confirm this existing account email before assigning Owner access.');
const role = await db.rpc('bootstrap_owner', { p_user_id: owner.id }); fail(role.error);
for (const project of projects.filter(item => item.status === 'built')) {
  const existing = await db.from('projects').select('id').eq('slug', project.slug).maybeSingle(); fail(existing.error);
  if (existing.data) continue; // Never overwrite a CMS edit when re-running bootstrap.
  const body = `## The quest\n\n${project.overview}\n\n## The puzzle\n\n${project.challenge}\n\n## The path I took\n\n${project.approach.map(step => `- ${step}`).join('\n')}\n\n## Where it stands\n\n${project.outcome}`;
  const saved = await db.from('projects').insert({ title: project.title, slug: project.slug, description: project.description, body, published: true, stage: project.status, live_url: project.liveUrl || null, source_url: project.sourceUrl || null, created_by: owner.id, updated_by: owner.id }).select('id').single(); fail(saved.error);
  for (const name of project.tags) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const tag = await db.from('tags').upsert({ name, slug }, { onConflict: 'name' }).select('id').single(); fail(tag.error);
    const join = await db.from('project_tags').insert({ project_id: saved.data.id, tag_id: tag.data.id }); fail(join.error);
  }
}
console.log('Owner bootstrap and initial portfolio seed completed. Existing content was preserved.');
console.log('Remove OWNER_BOOTSTRAP_PASSWORD from .env.local after confirming sign-in.');
