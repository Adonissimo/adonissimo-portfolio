'use client';
import Image from 'next/image';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api, RequestError } from '@/lib/client-api';
import type { CmsEntry, Role } from '@/lib/backend/domain';
import { Markdown } from './markdown';
import { RealmScene } from './realm-scene';
import { DashboardSkeleton } from './loading-state';
import { CinematicLink as Link } from './cinematic-link';

const sections = [['overview','Journal desk'],['projects','Projects'],['posts','Blog editor'],['tags','Tags'],['messages','Messages'],['notifications','Notifications'],['users','Users'],['settings','Settings'],['audit','Activity']] as const;
type Payload = { items?: unknown[]; item?: unknown; total?: number; page?: number; limit?: number; unread?: number; badge?: boolean };
type Message = { id: string; name: string; email: string; subject: string; body: string; status: string };
type User = { user_id: string; display_name: string; role: Role; active: boolean };
type Tag = { id: string; name: string };
type Preferences = { owner_email: boolean; sender_confirmation: boolean; badge: boolean };
type Notification = { id: string; message_id: string; created_at: string };
type Audit = { id: string; action: string; entity: string; entity_id: string; created_at: string };
const emptyEntry = (): CmsEntry => ({ id: '', title: '', slug: '', description: '', body: '', tags: [], published: false, stage: 'built', live_url: null, source_url: null, image_id: null });

function useRemote(endpoint: string | null) {
  const [data, setData] = useState<Payload | null>(null); const [error, setError] = useState('');
  const [pending, setPending] = useState(Boolean(endpoint)); const [version, setVersion] = useState(0);
  const reload = useCallback(() => { setPending(true); setVersion(value => value + 1); }, []);
  useEffect(() => {
    if (!endpoint) return;
    const controller = new AbortController(); let active = true;
    void api<Payload>(endpoint, { signal: controller.signal }).then(value => { if (active) { setData(value); setError(''); } }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'The records could not load.'); }).finally(() => { if (active) setPending(false); });
    return () => { active = false; controller.abort(); };
  }, [endpoint, version]);
  return { data, error, pending, reload };
}

function NotificationBadge() {
  const [unread, setUnread] = useState<number | null>(null); const [show, setShow] = useState(true);
  useEffect(() => {
    let active = true; let controller: AbortController | undefined;
    const load = () => {
      if (document.visibilityState === 'hidden' || controller) return;
      controller = new AbortController();
      void api<Payload>('/api/admin/notifications', { signal: controller.signal }).then(result => { if (active) { setUnread(result.unread ?? 0); setShow(result.badge === true); } }).catch(() => { if (active) setUnread(null); }).finally(() => { controller = undefined; });
    };
    load(); const timer = setInterval(load, 15000);
    window.addEventListener('adonissimo-notifications-change', load); document.addEventListener('visibilitychange', load);
    return () => { active = false; controller?.abort(); clearInterval(timer); window.removeEventListener('adonissimo-notifications-change', load); document.removeEventListener('visibilitychange', load); };
  }, []);
  return show ? <span className="count-badge" aria-live="polite" aria-label={unread === null ? 'Notification count unavailable' : `${unread} unread notifications`}>{unread ?? '—'}</span> : null;
}

export function AdminLive({ role, name, section, restricted }: { role: Role; name: string; section: string; restricted: boolean }) {
  const router = useRouter(); const owner = role === 'owner'; const editable = owner || role === 'editor';
  const [page, setPage] = useState(1); const [filter, setFilter] = useState('all');
  const [draft, setDraft] = useState<CmsEntry | null>(null); const [tagText, setTagText] = useState('');
  const [notice, setNotice] = useState(''); const [busy, setBusy] = useState(false); const [expired, setExpired] = useState(false);
  const endpoint = restricted || section === 'overview' ? null : `/api/admin/${section}?page=${page}&limit=20&status=${filter}`;
  const { data, pending, error, reload } = useRemote(endpoint);
  const entries = (data?.items ?? []) as CmsEntry[];
  useEffect(() => {
    let active = true; let last = 0;
    const activity = (event: Event) => {
      if (!event.isTrusted || document.visibilityState === 'hidden' || Date.now() - last < 60000) return;
      last = Date.now();
      void api('/api/session/activity', { method: 'POST', body: '{}' }).catch(reason => { if (active && reason instanceof RequestError && reason.status === 401) setExpired(true); });
    };
    document.addEventListener('pointerdown', activity, true); document.addEventListener('keydown', activity, true);
    return () => { active = false; document.removeEventListener('pointerdown', activity, true); document.removeEventListener('keydown', activity, true); };
  }, []);
  async function mutate(path: string, method: string, value?: unknown, complete?: () => void) {
    setBusy(true); setNotice('');
    try {
      await api(path, { method, ...(value === undefined ? {} : { body: JSON.stringify(value) }) });
      complete?.(); setNotice('Saved.'); reload(); window.dispatchEvent(new Event('adonissimo-notifications-change'));
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : 'The change could not be saved.'); if (reason instanceof RequestError && reason.status === 401) setExpired(true); }
    finally { setBusy(false); }
  }
  async function signOut() {
    setBusy(true);
    try { await api('/api/auth/logout', { method: 'POST', body: '{}' }); router.replace('/login'); router.refresh(); }
    catch (reason) { setNotice(reason instanceof Error ? reason.message : 'Sign out could not complete.'); }
    finally { setBusy(false); }
  }
  function edit(entry: CmsEntry) { setDraft({ ...entry }); setTagText(entry.tags.join(', ')); setNotice(''); }
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!draft) return;
    void mutate(`/api/admin/${section}${draft.id ? `/${draft.id}` : ''}`, draft.id ? 'PATCH' : 'POST', { ...draft, tags: tagText.split(',').map(value => value.trim()).filter(Boolean) }, () => setDraft(null));
  }
  async function upload(file: File | undefined) {
    if (!file || !draft) return;
    if (file.size > 5 * 1024 * 1024) { setNotice('Choose an image smaller than 5 MB.'); return; }
    const entryId = draft.id; const form = new FormData(); form.set('file', file); setBusy(true); setNotice('Uploading image…');
    try { const result = await api<{ item: { id: string } }>('/api/admin/media', { method: 'POST', body: form }); setDraft(current => current && current.id === entryId ? { ...current, image_id: result.item.id } : current); setNotice('Image uploaded. Save the entry to attach it.'); }
    catch (reason) { setNotice(reason instanceof Error ? reason.message : 'The image could not be uploaded.'); }
    finally { setBusy(false); }
  }
  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.limit ?? 20)));
  const content = section === 'projects' || section === 'posts';
  return <main id="main" data-realm="zonai" className="admin-page page-shell">
    <div className="admin-title"><div><h1>The journal desk.</h1><p>{name} · {role}</p></div><RealmScene realm="zonai" className="admin-vista" sizes="160px"/><button className="quiet-link" disabled={busy} onClick={() => void signOut()}>Sign out</button></div>
    {expired && <p role="alert" className="preview-note">Your session expired. Your open draft stays here until you leave this page. <Link href="/login">Sign in again</Link>.</p>}
    <div className="admin-workspace"><nav className="admin-navigation" aria-label="Dashboard">{sections.filter(([id]) => owner || !['messages','notifications','users','settings','audit'].includes(id)).map(([id,label]) => <Link href={id === 'overview' ? '/admin' : `/admin/${id}`} aria-current={section === id ? 'page' : undefined} key={id}>{label}{id === 'notifications' && owner && <NotificationBadge/>}</Link>)}<Link href="/">View portfolio</Link></nav>
      <div className="admin-content" aria-busy={pending || busy}><h2>{sections.find(([id]) => id === section)?.[1]}</h2>
        {notice && <p role="status" className="preview-note">{notice}</p>}
        {restricted ? <p role="alert">This screen requires Owner access. <Link href="/admin">Return to the desk</Link>.</p> : <>
          {error && <div role="alert" className="preview-note"><p>{error}</p><button onClick={reload}>Retry</button></div>}
          {pending && <><p role="status">Loading records…</p><DashboardSkeleton/></>}
          {section === 'overview' && <><p>Projects, field notes and letters are stored in your connected database.</p><div className="desk-actions"><Link className="button" href="/admin/projects">Manage projects</Link><Link className="quiet-link" href="/admin/posts">Open field notes</Link>{owner && <Link className="quiet-link" href="/admin/messages">Read messages</Link>}</div><p>Changes to published entries appear on the public site. Draft entries remain in the desk.</p></>}
          {content && (draft ? <form className="field-form" onSubmit={save}>
            <h3>{draft.id ? 'Edit entry' : 'Create entry'}</h3>
            {(['title','slug','description'] as const).map(key => <label key={key}>{key}<input value={draft[key]} required minLength={key === 'description' ? 10 : key === 'title' ? 2 : 1} maxLength={key === 'title' ? 120 : key === 'slug' ? 100 : 500} onChange={event => setDraft({ ...draft, [key]: event.target.value })}/></label>)}
            <label>Tags, separated by commas<input value={tagText} maxLength={500} onChange={event => setTagText(event.target.value)}/></label>
            {section === 'projects' && <><label>Project stage<select value={draft.stage} onChange={event => setDraft({ ...draft, stage: event.target.value as 'built' | 'planned' })}><option value="built">Built</option><option value="planned">Planned</option></select></label>{(['live_url','source_url'] as const).map(key => <label key={key}>{key === 'live_url' ? 'Live project URL' : 'Repository URL'}<input type="url" placeholder="https://…" maxLength={2048} value={draft[key] ?? ''} onChange={event => setDraft({ ...draft, [key]: event.target.value || null })}/></label>)}</>}
            <label>Cover image · PNG, JPEG or WebP, up to 5 MB<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={event => void upload(event.target.files?.[0])}/></label>
            {draft.image_id && <><Image className="cms-image-preview" src={`/api/admin/media/${draft.image_id}`} alt="Selected cover preview" width={800} height={500} unoptimized/><button type="button" disabled={busy} onClick={() => setDraft({ ...draft, image_id: null })}>Remove cover from entry</button></>}
            <div className="editor-columns"><label>Markdown content<textarea rows={14} minLength={10} maxLength={30000} required value={draft.body} onChange={event => setDraft({ ...draft, body: event.target.value })}/></label><section className="markdown-preview" aria-label="Live Markdown preview"><h3>Live preview</h3><Markdown source={draft.body}/></section></div>
            <label className="check-row"><input type="checkbox" checked={draft.published} onChange={event => setDraft({ ...draft, published: event.target.checked })}/>Published on the public site</label>
            <div className="desk-actions"><button className="button" disabled={busy || expired}>Save entry</button><button type="button" disabled={busy} onClick={() => setDraft(null)}>Cancel</button></div>
          </form> : <>{editable && <button className="button" disabled={busy || pending || expired} onClick={() => edit(emptyEntry())}>Create {section === 'posts' ? 'post' : 'project'}</button>}<div className="table-scroll" tabIndex={0} role="region" aria-label="Records table"><table><caption>{section === 'posts' ? 'Field notes' : 'Project records'}</caption><thead><tr><th scope="col">Title</th><th scope="col">Status</th><th scope="col">Actions</th></tr></thead><tbody>{entries.map(entry => <tr key={entry.id}><th scope="row">{entry.title}<small>/{entry.slug}</small></th><td>{entry.published ? 'Published' : 'Draft'}</td><td><div className="row-actions">{editable && <><button disabled={busy || pending} onClick={() => edit(entry)}>Edit</button><button disabled={busy || pending} onClick={() => void mutate(`/api/admin/${section}/${entry.id}`, 'PATCH', { ...entry, published: !entry.published })}>{entry.published ? 'Unpublish' : 'Publish'}</button></>}{owner && <button disabled={busy || pending} onClick={() => { if (window.confirm(`Permanently delete “${entry.title}”?`)) void mutate(`/api/admin/${section}/${entry.id}`, 'DELETE'); }}>Delete</button>}{!editable && <span>Read only</span>}</div></td></tr>)}</tbody></table></div>{!pending && !error && !entries.length && <p className="empty-state">No entries yet.</p>}</>)}
          {section === 'messages' && <><label className="filter-label">Message status<select value={filter} onChange={event => { setFilter(event.target.value); setPage(1); reload(); }}>{['all','unread','read','archived','spam'].map(value => <option key={value}>{value}</option>)}</select></label>{((data?.items ?? []) as Message[]).map(message => <details className="message-entry" key={message.id}><summary><strong>{message.subject}</strong><span>{message.name} · {message.email} · {message.status}</span></summary><p className="message-body">{message.body}</p><div className="row-actions">{['read','archived','spam','unread'].map(status => <button key={status} disabled={busy || message.status === status} onClick={() => void mutate(`/api/admin/messages/${message.id}`, 'PATCH', { status })}>Mark {status}</button>)}<button disabled={busy} onClick={() => { if (window.confirm('Permanently delete this message and its notifications?')) void mutate(`/api/admin/messages/${message.id}`, 'DELETE'); }}>Delete</button></div></details>)}{!pending && !error && !data?.items?.length && <p className="empty-state">No messages in this view.</p>}</>}
          {section === 'notifications' && <><p>{data?.unread ?? 0} unread notifications.</p>{((data?.items ?? []) as Notification[]).map(item => <article className="message-entry" key={item.id}><Link href="/admin/messages">A new letter arrived.</Link><button disabled={busy} onClick={() => void mutate(`/api/admin/notifications/${item.id}`, 'PATCH', {})}>Mark notification read</button></article>)}{!pending && !data?.items?.length && <p className="empty-state">You’re all caught up.</p>}</>}
          {section === 'users' && <div className="table-scroll" tabIndex={0} role="region" aria-label="Records table"><table><caption>Account permissions</caption><thead><tr><th>Name</th><th>Role</th><th>Enabled</th></tr></thead><tbody>{((data?.items ?? []) as User[]).map(user => <tr key={user.user_id}><th scope="row">{user.display_name}</th><td><select disabled={busy} aria-label={`Role for ${user.display_name}`} value={user.role} onChange={event => void mutate(`/api/admin/users/${user.user_id}`, 'PATCH', { role: event.target.value, active: user.active })}>{['viewer','editor','owner'].map(value => <option key={value}>{value}</option>)}</select></td><td><input type="checkbox" aria-label={`Enable ${user.display_name}`} disabled={busy} checked={user.active} onChange={event => void mutate(`/api/admin/users/${user.user_id}`, 'PATCH', { role: user.role, active: event.target.checked })}/></td></tr>)}</tbody></table><p>The last active Owner cannot be disabled or demoted.</p></div>}
          {section === 'settings' && data?.item && <>{([['owner_email','Email me about new messages'],['sender_confirmation','Send visitor confirmations'],['badge','Show new-message notifications']] as const).map(([key,label]) => <label className="setting-row" key={key}><span>{label}</span><input type="checkbox" disabled={busy} checked={(data.item as Preferences)[key]} onChange={event => void mutate('/api/admin/settings', 'PATCH', { ...(data.item as Preferences), [key]: event.target.checked })}/></label>)}</>}
          {section === 'tags' && <>{editable && <form className="field-form" onSubmit={event => { event.preventDefault(); const form = event.currentTarget; const name = new FormData(form).get('name'); void mutate('/api/admin/tags', 'POST', { name }, () => form.reset()); }}><label>New tag<input name="name" maxLength={40} required/></label><button className="button" disabled={busy}>Create tag</button></form>}{((data?.items ?? []) as Tag[]).map(tag => <div className="setting-row" key={tag.id}><span>{tag.name}</span><div className="row-actions">{editable && <button disabled={busy} onClick={() => { const value = window.prompt('Tag name', tag.name); if (value) void mutate(`/api/admin/tags/${tag.id}`, 'PATCH', { name: value }); }}>Rename</button>}{owner && <button disabled={busy} onClick={() => { if (window.confirm(`Delete tag “${tag.name}”?`)) void mutate(`/api/admin/tags/${tag.id}`, 'DELETE'); }}>Delete</button>}</div></div>)}</>}
          {section === 'audit' && <div className="audit-list" tabIndex={0} role="region" aria-label="Activity records">{((data?.items ?? []) as Audit[]).map(item => <p key={item.id}><time dateTime={item.created_at}>{item.created_at.replace('T',' ').slice(0,19)} UTC</time> · {item.action} · {item.entity} · {item.entity_id}</p>)}{!pending && !data?.items?.length && <p className="empty-state">No activity yet.</p>}</div>}
          {(content || section === 'messages') && !draft && <nav className="pagination" aria-label="Dashboard pages"><button disabled={page <= 1 || pending} onClick={() => { setPage(value => value-1); reload(); }}>Previous</button><span>Page {page} of {pages}</span><button disabled={page >= pages || pending} onClick={() => { setPage(value => value+1); reload(); }}>Next</button></nav>}
        </>}
      </div>
    </div>
  </main>;
}
