import { revalidatePath } from 'next/cache';
import { requireActor } from '@/lib/backend/auth';
import { AppError, isRole, text, uuid, validateEntry } from '@/lib/backend/domain';
import { listEntries, selectEntry, normalizeEntry, type JoinedEntry } from '@/lib/backend/content';
import { bodyJson, dbFailure, json, rateLimit, route, sameOrigin } from '@/lib/backend/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
type Context = { params: Promise<{ path: string[] }> };
async function handle(request: Request, context: Context) {
  const { path } = await context.params;
  return route(async req => {
    const [section, recordId] = path;
    if (path.length > 2) throw new AppError(404, 'Endpoint not found.');
    const method = req.method;
    if (method !== 'GET') sameOrigin(req);
    const content = section === 'projects' || section === 'posts';
    const permission = content ? method === 'GET' ? 'read' : method === 'DELETE' ? 'delete' : 'write' : section === 'tags' ? method === 'GET' ? 'read' : method === 'DELETE' ? 'delete' : 'write' : 'manage';
    const actor = await requireActor(permission, !(section === 'notifications' && method === 'GET'));
    if (method !== 'GET') await rateLimit(req, 'admin-write', 60, 60, actor.id);
    if (content) {
      if (method === 'GET') return json(await listEntries(actor.db, section, new URL(req.url).searchParams, false));
      if (method === 'POST' || method === 'PATCH') {
        if (method === 'PATCH' && !recordId) throw new AppError(400, 'Choose an entry to edit.');
        if (method === 'POST' && recordId) throw new AppError(400, 'Create entries at the collection endpoint.');
        const entry = validateEntry(await bodyJson(req), method === 'PATCH' ? recordId : undefined);
        const { data, error } = await actor.db.rpc('save_content', { p_kind: section, p_entry: entry });
        dbFailure(error);
        revalidatePath('/', 'layout');
        const saved = await actor.db.from(section).select(selectEntry(section)).eq('id', data).single<JoinedEntry>();
        dbFailure(saved.error);
        if (!saved.data) throw new AppError(503, 'The entry was saved but could not be reloaded. Refresh the list.');
        return json({ item: normalizeEntry(saved.data) }, method === 'POST' ? 201 : 200);
      }
      if (method === 'DELETE' && recordId) {
        const { data, error } = await actor.db.from(section).delete().eq('id', uuid(recordId)).select('id');
        dbFailure(error); if (!data?.length) throw new AppError(404, 'The entry was not found.');
        revalidatePath('/', 'layout'); return json({ ok: true });
      }
    }
    if (section === 'tags') {
      if (method === 'GET') { const result = await actor.db.from('tags').select('*').order('name').limit(200); dbFailure(result.error); return json({ items: result.data }); }
      if (method === 'POST' || (method === 'PATCH' && recordId)) {
        const input = await bodyJson(req); const name = text(input.name, 'name', 1, 40); const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        if (!slug) throw new AppError(422, 'Use a tag containing letters or numbers.');
        const result = method === 'POST' ? await actor.db.from('tags').insert({ name, slug }).select().single() : await actor.db.from('tags').update({ name, slug }).eq('id', uuid(recordId)).select().single();
        dbFailure(result.error); revalidatePath('/', 'layout'); return json({ item: result.data }, method === 'POST' ? 201 : 200);
      }
      if (method === 'DELETE' && recordId) { const result = await actor.db.from('tags').delete().eq('id', uuid(recordId)).select('id'); dbFailure(result.error); if (!result.data?.length) throw new AppError(404, 'Tag not found.'); revalidatePath('/', 'layout'); return json({ ok: true }); }
    }
    if (section === 'messages') {
      if (method === 'GET') {
        const url = new URL(req.url); const page = Math.max(1, Math.min(10000, Number(url.searchParams.get('page')) || 1));
        let query = actor.db.from('messages').select('*', { count: 'exact' }).order('created_at', { ascending: false });
        const status = url.searchParams.get('status'); if (status && status !== 'all') { if (!['unread','read','archived','spam'].includes(status)) throw new AppError(400, 'Invalid message status.'); query = query.eq('status', status); }
        const result = await query.range((page-1)*20,page*20-1); dbFailure(result.error); return json({ items: result.data, total: result.count, page, limit: 20 });
      }
      if (method === 'PATCH' && recordId) {
        const input = await bodyJson(req); if (!['unread','read','archived','spam'].includes(String(input.status))) throw new AppError(422, 'Choose a valid message status.');
        const result = await actor.db.from('messages').update({ status: input.status }).eq('id', uuid(recordId)).select().maybeSingle(); dbFailure(result.error); if (!result.data) throw new AppError(404, 'Message not found.');
        return json({ item: result.data });
      }
      if (method === 'DELETE' && recordId) { const result = await actor.db.from('messages').delete().eq('id', uuid(recordId)).select('id'); dbFailure(result.error); if (!result.data?.length) throw new AppError(404, 'Message not found.'); return json({ ok: true }); }
    }
    if (section === 'users') {
      if (method === 'GET') { const result = await actor.db.from('profiles').select('user_id,display_name,role,active,created_at').order('created_at').limit(200); dbFailure(result.error); return json({ items: result.data }); }
      if (method === 'PATCH' && recordId) {
        const input = await bodyJson(req); if (!isRole(input.role) || typeof input.active !== 'boolean') throw new AppError(422, 'Choose a valid role and account state.');
        const result = await actor.db.rpc('change_user_role', { p_user_id: uuid(recordId), p_role: input.role, p_active: input.active }); dbFailure(result.error); return json({ ok: true });
      }
    }
    if (section === 'settings') {
      if (method === 'GET') { const result = await actor.db.from('notification_preferences').select('*').eq('user_id', actor.id).single(); dbFailure(result.error); return json({ item: result.data }); }
      if (method === 'PATCH') {
        const input = await bodyJson(req); for (const key of ['owner_email','sender_confirmation','badge']) if (typeof input[key] !== 'boolean') throw new AppError(422, 'Choose valid notification preferences.');
        const result = await actor.db.from('notification_preferences').update({ owner_email: input.owner_email, sender_confirmation: input.sender_confirmation, badge: input.badge }).eq('user_id', actor.id).select().single(); dbFailure(result.error); return json({ item: result.data });
      }
    }
    if (section === 'notifications') {
      if (method === 'GET') {
        const pref = await actor.db.from('notification_preferences').select('badge').eq('user_id', actor.id).single(); dbFailure(pref.error);
        const result = await actor.db.from('notifications').select('id,message_id,read_at,created_at', { count: 'exact' }).is('read_at', null).order('created_at', { ascending: false }).limit(50); dbFailure(result.error);
        return json({ items: result.data, unread: result.count ?? 0, badge: pref.data?.badge === true });
      }
      if (method === 'PATCH' && recordId) { const result = await actor.db.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', uuid(recordId)).select('id'); dbFailure(result.error); if (!result.data?.length) throw new AppError(404, 'Notification not found.'); return json({ ok: true }); }
    }
    if (section === 'audit' && method === 'GET') { const result = await actor.db.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100); dbFailure(result.error); return json({ items: result.data }); }
    throw new AppError(405, 'This method is not available at this endpoint.');
  })(request);
}
export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
